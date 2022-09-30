import path from 'path'
import execa from 'execa'
import fs from 'fs-extra'
import type {
  AggregatedResult,
  AssertionResult,
  TestResult,
} from '@jest/test-result'

const rootDir = path.resolve(__dirname, '..')
const vscodeTestDir = path.resolve(rootDir, '.vscode-test')

function sortByProperty<T>(property: keyof T): (a: T, b: T) => number {
  return (a, b) => {
    if (a[property] < b[property]) {
      return -1
    }
    if (a[property] > b[property]) {
      return 1
    }
    return 0
  }
}

function normalizeMessages<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    const objAsObj = obj as { [key in keyof T]: unknown }
    const keys = Object.getOwnPropertyNames(obj) as (keyof T)[]
    keys.forEach(key => {
      const value = objAsObj[key]

      if (key === 'failureMessage' || key === 'message') {
        objAsObj[key] = ''
      } else if (key === 'failureMessages' && Array.isArray(value)) {
        objAsObj[key] = value.map(() => '')
      } else {
        objAsObj[key] = normalizeMessages(value)
      }
    })
  }
  return obj
}

function normalizePath(pathString: string): string {
  if (!pathString || typeof pathString !== 'string') {
    return pathString
  }
  return path === path.win32
    ? pathString.replace(rootDir, '').replace(/\\/g, '/')
    : pathString.replace(rootDir, '')
}

type ActualTestResult = TestResult & {
  name: string
  assertionResults: AssertionResult[]
}

type ActualAggregatedResult = Omit<AggregatedResult, 'testResults'> & {
  testResults: ActualTestResult[]
}

function normalizeResults(
  results: ActualAggregatedResult
): ActualAggregatedResult {
  const clean = Object.assign({}, results, {
    testResults: results.testResults.sort(sortByProperty('name')).map(result =>
      Object.assign({}, result, {
        assertionResults: result.assertionResults.sort(
          sortByProperty('fullName')
        ),
        failureMessage: result.failureMessage,
        name: normalizePath(result.name),
        startTime: undefined,
        endTime: undefined,
      })
    ),
    startTime: undefined,
  })
  return normalizeMessages(clean)
}

export async function prepareDir(cwd: string): Promise<void> {
  await fs.ensureDir(vscodeTestDir)
  await fs.ensureSymlink(
    path.relative(cwd, vscodeTestDir),
    path.resolve(cwd, '.vscode-test'),
    'dir'
  )
  await fs.ensureFile(path.resolve(cwd, 'yarn.lock'))
  await fs.symlink(
    path.resolve(__dirname, '../.pnp.cjs'),
    path.resolve(cwd, '.pnp.cjs'),
    'file'
  )
}

async function gracefulReadFile(file: string): Promise<string> {
  try {
    return await fs.readFile(file, 'utf8')
  } catch (e) {
    return ''
  }
}

export async function runJest(
  cwd: string,
  args: string[] = []
): Promise<execa.ExecaChildProcess & Promise<{ json: unknown }>> {
  const results = await execa(
    'jest',
    ['--json', '--outputFile', 'jest-output.json', ...args],
    {
      cwd,
      preferLocal: true,
      timeout: 30000,
      reject: false,
    }
  )
  const outputFile = path.resolve(cwd, 'jest-output.json')
  const output = await gracefulReadFile(outputFile)

  if (output.trim()) {
    try {
      const json = JSON.parse(output) as ActualAggregatedResult
      return {
        ...results,
        json: normalizeResults(json),
      }
    } catch (error) {
      console.error(`Failed to parse jest output: ${output}`)
      throw error
    }
  }

  return { ...results, json: {} }
}
