import type {
  DownloadPlatform,
  DownloadVersion,
} from '@vscode/test-electron/out/download'

/**
 * VS Code runner options
 */
export interface RunnerOptions {
  /**
   * The path to the VS Code executable. If not specified, a copy will be
   * downloaded using the version and platform specified, or the latest stable
   * release if none is specified.
   */
  vscodeExecutablePath?: string

  /**
   * The version of VS Code to download. If not specified, the latest stable
   * release will be downloaded.
   */
  version?: DownloadVersion

  /**
   * The platform of the VS Code executable to download. If not specified, the
   * platform of the current process will be used.
   */
  platform?: DownloadPlatform

  /**
   * Environment variables to set when launching VS Code. Will be merged with
   * the environment variables of the current process.
   */
  extensionTestsEnv?: Record<string, string>

  /**
   * Arguments to pass to the VS Code executable.
   */
  launchArgs?: string[]

  /**
   * The absolute path to the extension to test. Should be the path to the
   * directory containing the extension's `package.json` file. If not
   * specified, the Jest root directory will be used.
   */
  extensionDevelopmentPath?: string

  /**
   * The path to the workspace directory or workspace file to open. Used if
   * `openInFolder` is set to `true`.
   */
  workspaceDir?: string

  /**
   * Whether to start VS Code in a workspace or not. Defaults to `false`.
   */
  openInFolder?: boolean

  /**
   * Whether to filter console output to only captured messages from tests.
   * Defaults to `false`.
   *
   * NOTE: Console output is captured using `console.log`, `console.error`,
   * `console.warn`, `console.info`, and `console.dir`. Console output from
   * other sources, such as `console.time`, `process.stdout.write`, etc., will
   * not be captured. Only the global console methods will be captured — if the
   * console is imported, output will not be captured.
   */
  filterOutput?: boolean

  /**
   * Whether to suppress information about the VS Code process, such as the exit
   * code, or download progress. Defaults to `false`.
   */
  quiet?: boolean
}
