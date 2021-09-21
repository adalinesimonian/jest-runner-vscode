import path from 'path'
import execa from 'execa'
import fs from 'fs-extra'
import type { AggregatedResult, AssertionResult } from '@jest/test-result'

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
    const objAsAny = obj as any
    Object.getOwnPropertyNames(obj).forEach(key => {
      if (key === 'failureMessage' || key === 'message') {
        objAsAny[key] = ''
      } else if (key === 'failureMessages' && Array.isArray(objAsAny[key])) {
        objAsAny[key] = objAsAny[key].map(() => '')
      } else {
        objAsAny[key] = normalizeMessages(objAsAny[key])
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

function normalizeResults(results: AggregatedResult): AggregatedResult {
  const clean = Object.assign({}, results, {
    testResults: results.testResults
      .sort(sortByProperty('name' as any))
      .map(result =>
        Object.assign({}, result, {
          assertionResults: (
            (result as any).assertionResults as AssertionResult[]
          ).sort(sortByProperty('fullName')),
          failureMessage: result.failureMessage,
          name: normalizePath((result as any).name),
          startTime: undefined,
          endTime: undefined,
        })
      ),
    startTime: undefined,
  })
  return normalizeMessages(clean)
}

export async function prepareDir(cwd: string): Promise<void> {
  await fs.ensureSymlink(
    path.relative(cwd, path.resolve(__dirname, '../.vscode-test')),
    path.resolve(cwd, '.vscode-test'),
    'dir'
  )
  await fs.ensureFile(path.resolve(cwd, 'yarn.lock'))
  await execa('yarn', ['--cwd', cwd], {
    cwd,
    timeout: 30000,
  })
}

export async function runJest(
  cwd: string,
  args: string[] = []
): Promise<execa.ExecaChildProcess & Promise<{ json: any }>> {
  const results = await execa('jest', ['--json', ...args], {
    cwd,
    preferLocal: true,
    timeout: 30000,
    reject: false,
  })
  const jestOutput = results.stdout.match(/\n?[^\n]+\n*$/)?.[0]
  return {
    ...results,
    json: jestOutput ? normalizeResults(JSON.parse(jestOutput)) : {},
  }
}
