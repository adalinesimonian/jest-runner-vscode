import type { Config } from '@jest/types'
import type * as JestRunner from 'jest-runner'
import type { TestResult as JestTestResult } from '@jest/types'
import type { TestResult } from '@jest/test-result'
import { IPC } from 'node-ipc'
import type { RunnerOptions } from './types'
import path from 'path'
import process from 'process'
import { cosmiconfig } from 'cosmiconfig'
import downloadVSCode from './download-vscode'
import runVSCode from './run-vscode'

export type { RunnerOptions }

export default class VSCodeTestRunner {
  readonly _globalConfig: Config.GlobalConfig
  readonly _context: JestRunner.TestRunnerContext
  readonly isSerial = true

  constructor(
    globalConfig: Config.GlobalConfig,
    context: JestRunner.TestRunnerContext = {}
  ) {
    this._globalConfig = globalConfig
    this._context = context
  }

  async runTests(
    tests: JestRunner.Test[],
    watcher: JestRunner.TestWatcher,
    onStart: JestRunner.OnTestStart,
    onResult: JestRunner.OnTestSuccess,
    onFailure: JestRunner.OnTestFailure,
    options: JestRunner.TestRunnerOptions
  ): Promise<void> {
    const baseVSCodeOptions: RunnerOptions =
      (await cosmiconfig('jest-runner-vscode').search())?.config ?? {}

    // Runs a separate process for each test directory.
    //
    // VS Code restarts the extension host process any time the open directory
    // changes, so tests that switch between directories cause the child VS Code
    // process to disconnect.
    //
    // To get around this, we run each set of tests that are located in
    // different directories in their own VS Code process. This provides an easy
    // way to run tests that need to be run in different directories.
    //
    // Example:
    //
    //   /project/__tests__/needs_dir1/test1.js
    //   /project/__tests__/needs_dir1/test2.js --> run in the same process
    //   /project/__tests__/needs_dir2/test.js  --> runs in a separate process

    // Group tests by directory.
    const testsByDir = new Map<string, Array<JestRunner.Test>>()

    for (const test of tests) {
      const dir = path.dirname(test.path)
      const existingTests = testsByDir.get(dir)

      if (existingTests) {
        existingTests.push(test)
      } else {
        testsByDir.set(dir, [test])
      }
    }

    // Start IPC server.
    const ipc = new IPC()

    ipc.config.silent = true
    ipc.config.id = `jest-runner-vscode-server-${process.pid}`

    await new Promise<void>(resolve => {
      ipc.serve(resolve)
      ipc.server.start()
    })

    // Run each group of tests in its own VS Code process.
    for (const [testDir, testGroup] of testsByDir.entries()) {
      if (watcher.isInterrupted()) {
        ipc.server.stop()
        throw Object.assign(new Error(), { name: 'CancelRun' })
      }

      try {
        const vscodeOptions: RunnerOptions = {
          ...baseVSCodeOptions,
          ...((await cosmiconfig('jest-runner-vscode').search(testDir))
            ?.config ?? {}),
        }

        const vscodePath =
          vscodeOptions.vscodeExecutablePath ??
          (await downloadVSCode(
            vscodeOptions.version,
            vscodeOptions.platform,
            this._globalConfig.silent,
            this._globalConfig.json || this._globalConfig.useStderr
          ))

        const args = [
          '-n',
          '--no-sandbox',
          '--disable-workspace-trust',
          `--extensionDevelopmentPath=${
            vscodeOptions.extensionDevelopmentPath ?? this._globalConfig.rootDir
          }`,
          `--extensionTestsPath=${require.resolve('./child-process-runner')}`,
          ...(vscodeOptions.openInFolder
            ? [vscodeOptions.workspaceDir ?? testDir]
            : []),
          ...(vscodeOptions.launchArgs ?? []),
        ]

        for (const test of testGroup) {
          await onStart(test)
        }

        const testResults = await runVSCode(
          vscodePath,
          args,
          vscodeOptions.extensionTestsEnv ?? {},
          {
            globalConfig: this._globalConfig,
            workspacePath: this._globalConfig.rootDir,
            options,
            testPaths: testGroup.map(test => test.path),
          },
          ipc
        )

        if (!testResults) {
          throw new Error('No response from VS Code')
        }

        if (testResults.is === 'error') {
          throw testResults.error
        }

        const testResultsByPath = new Map<string, TestResult>()

        for (const result of testResults.results.testResults) {
          testResultsByPath.set((result as any).testFilePath, result)
        }

        for (const test of testGroup) {
          const result = testResultsByPath.get(test.path)

          if (!result) {
            await onFailure(
              test,
              new Error(
                `No test result returned for ${test.path}`
              ) as JestTestResult.SerializableError
            )
            continue
          }

          if (result.testExecError) {
            const error: JestTestResult.SerializableError = Object.assign(
              new Error(
                result.testExecError.message ??
                  (result.testExecError as any).diagnosticText ??
                  result.failureMessage?.replace(/^[^\n]+\n\n?/, '')
              ),
              { code: undefined, stack: undefined, type: undefined },
              result.testExecError
            )
            await onFailure(test, error)
          } else {
            await onResult(test, result)
          }
        }
      } catch (error: any) {
        for (const test of testGroup) {
          await onFailure(test, error)
        }
      }
    }

    ipc.server.stop()
  }
}
