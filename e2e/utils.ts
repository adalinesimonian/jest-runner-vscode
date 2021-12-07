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
    const objAsAny = obj
    const keys = Object.getOwnPropertyNames(obj) as (keyof T)[]
    keys.forEach(key => {
      const value = objAsAny[key] as unknown

      if (key === 'failureMessage' || key === 'message') {
        objAsAny[key] = '' as unknown as T[keyof T]
      } else if (key === 'failureMessages' && Array.isArray(value)) {
        objAsAny[key] = value.map(() => '') as unknown as T[keyof T]
      } else {
        objAsAny[key] = normalizeMessages(value) as T[keyof T]
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

export async function runJest(
  cwd: string,
  args: string[] = []
): Promise<execa.ExecaChildProcess & Promise<{ json: unknown }>> {
  const results = await execa('jest', ['--json', ...args], {
    cwd,
    preferLocal: true,
    timeout: 30000,
    reject: false,
  })
  const jestOutput = results.stdout.match(/\n?[^\n]+\n*$/)?.[0]

  if (jestOutput) {
    try {
      const json = JSON.parse(jestOutput) as ActualAggregatedResult
      return {
        ...results,
        json: normalizeResults(json),
      }
    } catch (error) {
      console.error(`Failed to parse jest output: ${jestOutput}`)
      throw error
    }
  }

  return { ...results, json: {} }
}
