import type { RemoteTestOptions } from './types'
import type { TestResult, SerializableError } from '@jest/test-result'
import type { Test } from '@jest/reporters/build/types'
import type * as JestRunner from 'jest-runner'
import cp from 'child_process'
import console from 'console'
import type { IPC } from 'node-ipc'

export default async function runVSCode({
  vscodePath,
  args,
  env,
  options,
  ipc,
  tests,
  filterOutput,
  onStart,
  onResult,
  onFailure,
}: {
  vscodePath: string
  args: string[]
  env?: Record<string, string>
  options: RemoteTestOptions
  ipc: InstanceType<typeof IPC>
  tests: Test[]
  filterOutput?: boolean
  onStart: JestRunner.OnTestStart
  onResult: JestRunner.OnTestSuccess
  onFailure: JestRunner.OnTestFailure
}): Promise<void> {
  return await new Promise<void>(resolve => {
    const useStdErr =
      options.globalConfig.json || options.globalConfig.useStderr
    const log = useStdErr ? console.error : console.log
    const silent = options.globalConfig.silent

    const environment = {
      ...process.env,
      NODE_OPTIONS: process.env.NODE_OPTIONS
        ? process.env.NODE_OPTIONS.replace(
            /(?:--require .+?\.pnp\.c?js|--experimental-loader .+?\.pnp\.loader\.mjs)/g,
            ''
          )
        : '',
      ...env,
      PARENT_JEST_OPTIONS: JSON.stringify(options),
      PARENT_CWD: process.cwd(),
      IPC_CHANNEL: ipc.config.id,
    }

    const testsByPath = new Map<string, Test>()

    for (const test of tests) {
      testsByPath.set(test.path, test)
    }

    const completedTests = new Set<Test>()

    const onTestFileResult = ({
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
              (testResult.testExecError as any).diagnosticText ??
              testResult.failureMessage?.replace(/^[^\n]+\n\n?/, '')
          ),
          { code: undefined, stack: undefined, type: undefined },
          testResult.testExecError
        )

        onFailure(matchingTest, error)
      } else {
        onResult(matchingTest, testResult)
      }
    }

    const onTestStart = ({ test }: { test: Test }) => {
      const matchingTest = testsByPath.get(test.path)
      if (!matchingTest) {
        return
      }
      onStart(matchingTest)
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
      silent || log(error.stack)
    }

    ipc.server.on('testFileResult', onTestFileResult)
    ipc.server.on('testStart', onTestStart)
    ipc.server.on('testFileStart', onTestStart)
    ipc.server.on('stdout', onStdout)
    ipc.server.on('stderr', onStderr)
    ipc.server.on('error', onError)

    console.log('Starting VS Code')
    console.log(`  ${vscodePath} ${args.join(' ')}`)
    console.log(environment)

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

      const exit = code ?? signal
      const message = `VS Code exited with exit code ${exit}`

      if (typeof code !== 'number' || code !== 0) {
        silent || console.error(message)
        const error = vscodeError ?? childError ?? new Error(message)

        for (const test of tests) {
          const completed = completedTests.has(test)

          if (!completed) {
            await onFailure(test, error as SerializableError)
          }
        }
      } else {
        silent || log(message)

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

    vscode.on('exit', onExit)
    vscode.on('close', onExit)
  })
}
