import path from 'path'
import execa from 'execa'
import fs from 'fs-extra'
import type {
  AggregatedResult,
  AssertionResult,
  TestResult,
} from '@jest/test-result'

const rootDir = path.resolve(__dirname, '..')

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
        assertionResults: result.assertionResults
          .sort(sortByProperty('fullName'))
          .map(assertionResult => ({
            ...assertionResult,
            duration: undefined,
          })),
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

/**
 * Installs dependencies in the given directory using `yarn --immutable`.
 * @param cwd The directory to prepare.
 */
export async function prepareDir(cwd: string): Promise<void> {
  const relative = path.relative(rootDir, cwd)

  process.stdout.write(`Installing dependencies in ${relative}...\n`)
  await execa('yarn', ['--immutable'], { cwd })
  process.stdout.write(`Dependencies installed in ${relative}.\n`)
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
    'yarn',
    ['jest', '--json', '--outputFile', 'jest-output.json', ...args],
    { cwd, timeout: 30000, reject: false }
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
