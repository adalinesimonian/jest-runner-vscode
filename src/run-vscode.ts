import type { RemoteTestOptions } from './types'
import type { TestResult, SerializableError } from '@jest/test-result'
import type { Test } from '@jest/test-result'
import type * as JestRunner from 'jest-runner'
import cp from 'child_process'
import console from 'console'
import type { IPC } from '@achrinza/node-ipc'
import { Config } from '@jest/types'

export type RunVSCodeOptions = {
  vscodePath: string
  args: string[]
  jestArgs: string[]
  env?: Record<string, string>
  tests: Test[]
  globalConfig: Config.GlobalConfig
  filterOutput?: boolean
  onStart: JestRunner.OnTestStart
  onResult: JestRunner.OnTestSuccess
  onFailure: JestRunner.OnTestFailure
  ipc: InstanceType<typeof IPC>
  quiet?: boolean
}

export default async function runVSCode({
  vscodePath,
  args,
  jestArgs,
  env,
  tests,
  globalConfig,
  filterOutput,
  onStart,
  onResult,
  onFailure,
  ipc,
  quiet,
}: RunVSCodeOptions): Promise<void> {
  return await new Promise<void>(resolve => {
    const useStdErr = globalConfig.json || globalConfig.useStderr
    const log = useStdErr
      ? console.error.bind(console)
      : console.log.bind(console)
    const { silent } = globalConfig

    const remoteOptions: RemoteTestOptions = {
      args: jestArgs,
      testPaths: tests.map(test => test.path),
      workspacePath: globalConfig.rootDir,
    }

    const environment = {
      ...process.env,
      NODE_OPTIONS: process.env.NODE_OPTIONS
        ? process.env.NODE_OPTIONS.replace(
            /(?:--require .+?\.pnp\.c?js|--experimental-loader .+?\.pnp\.loader\.mjs)/g,
            ''
          )
        : '',
      ...env,
      PARENT_JEST_OPTIONS: JSON.stringify(remoteOptions),
      PARENT_CWD: process.cwd(),
      IPC_CHANNEL: ipc.config.id,
    }

    const testsByPath = new Map<string, Test>()

    for (const test of tests) {
      testsByPath.set(test.path, test)
    }

    const completedTests = new Set<Test>()

    const onTestFileResult = async ({
      test,
      testResult,
    }: {
      test: Test
      testResult: TestResult
    }) => {
      const matchingTest = testsByPath.get(test.path)
      if (!matchingTest) {
        return
      }
      completedTests.add(matchingTest)
      if (testResult.testExecError) {
        const error: SerializableError = Object.assign(
          new Error(
            testResult.testExecError.message ??
              (
                testResult.testExecError as SerializableError & {
                  diagnosticText: string
                }
              ).diagnosticText ??
              testResult.failureMessage?.replace(/^[^\n]+\n\n?/, '')
          ),
          { code: undefined, stack: undefined, type: undefined },
          testResult.testExecError
        )

        await onFailure(matchingTest, error)
      } else {
        await onResult(matchingTest, testResult)
      }
    }

    const onTestStart = async ({ test }: { test: Test }) => {
      const matchingTest = testsByPath.get(test.path)
      if (!matchingTest) {
        return
      }
      await onStart(matchingTest)
    }

    const onStdout = (str: string) => {
      if (!silent) {
        process.stdout.write(`${str}\n`)
      }
    }

    const onStderr = (str: string) => {
      if (!silent) {
        process.stderr.write(`${str}\n`)
      }
    }

    let childError: Error | undefined

    const onError = (error: Error) => {
      childError = error
      silent || quiet || log(error.stack)
    }

    ipc.server.on(
      'testFileResult',
      (param: Parameters<typeof onTestFileResult>[0]) => {
        onTestFileResult(param).catch(onError)
      }
    )
    ipc.server.on('testStart', (param: Parameters<typeof onTestStart>[0]) => {
      onTestStart(param).catch(onError)
    })
    ipc.server.on(
      'testFileStart',
      (param: Parameters<typeof onTestStart>[0]) => {
        onTestStart(param).catch(onError)
      }
    )
    ipc.server.on('stdout', onStdout)
    ipc.server.on('stderr', onStderr)
    ipc.server.on('error', onError)

    const vscode = cp.spawn(vscodePath, args, { env: environment })

    if (!silent && !filterOutput) {
      vscode.stdout.pipe(process.stdout)
      vscode.stderr.pipe(process.stderr)
    }

    let vscodeError: Error | undefined

    vscode.on('error', error => {
      vscodeError = error
    })

    let exited = false

    const onExit = async (
      code: number | null,
      signal: NodeJS.Signals | null
    ): Promise<void> => {
      if (exited) {
        return
      }
      exited = true

      const exit = code ?? signal ?? '<unknown>'
      const message = `VS Code exited with exit code ${exit}`

      if (typeof code !== 'number' || code !== 0) {
        silent || quiet || console.error(message)
        const error = vscodeError ?? childError ?? new Error(message)

        for (const test of tests) {
          const completed = completedTests.has(test)

          if (!completed) {
            await onFailure(test, error as SerializableError)
          }
        }
      } else {
        silent || quiet || log(message)

        for (const test of tests) {
          const completed = completedTests.has(test)

          if (!completed) {
            await onFailure(
              test,
              (childError ??
                new Error(
                  `No test result returned for ${test.path}`
                )) as SerializableError
            )
          }
        }
      }

      ipc.server.off('testFileResult', onTestFileResult)
      ipc.server.off('testStart', onTestStart)
      ipc.server.off('testFileStart', onTestStart)
      ipc.server.off('stdout', onStdout)
      ipc.server.off('stderr', onStderr)
      ipc.server.off('error', onError)

      resolve()
    }

    const onExitWrapper = (
      code: number | null,
      signal: NodeJS.Signals | null
    ) => {
      onExit(code, signal).catch((error: Error) => {
        onError(error)
        resolve()
      })
    }

    vscode.on('exit', onExitWrapper)
    vscode.on('close', onExitWrapper)
  })
}
