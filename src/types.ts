import type { AggregatedResult } from '@jest/test-result'
import type {
  DownloadPlatform,
  DownloadVersion,
} from '@vscode/test-electron/out/download'

export interface RunnerOptions {
  vscodeExecutablePath?: string
  version?: DownloadVersion
  platform?: DownloadPlatform
  extensionTestsEnv?: Record<string, string>
  launchArgs?: string[]
  extensionDevelopmentPath?: string
  workspaceDir?: string
  openInFolder?: boolean
  filterOutput?: boolean
  quiet?: boolean
}

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
