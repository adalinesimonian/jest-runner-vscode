import type { AggregatedResult } from '@jest/test-result'

export * from './public-types'

export interface RemoteTestOptions {
  testPaths: string[]
  args: string[]
  workspacePath: string
}

export type RemoteTestResults =
  | {
      is: 'ok'
      results: AggregatedResult
    }
  | {
      is: 'error'
      error: Error
      exitCode?: number | NodeJS.Signals | null
    }
