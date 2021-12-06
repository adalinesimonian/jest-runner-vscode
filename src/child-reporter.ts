import type {
  AggregatedResult,
  TestCaseResult,
  TestResult,
} from '@jest/test-result'
import type {
  ReporterOnStartOptions,
  Test,
  Reporter,
  Context,
} from '@jest/reporters'
import IPCClient from './ipc-client'
import wrapIO from './wrap-io'

export default class ChildReporter implements Reporter {
  #ipc: IPCClient
  #onConnected: Promise<void>

  constructor() {
    this.#ipc = new IPCClient('reporter')
    this.#onConnected = this.#ipc.connect()

    wrapIO(this.#ipc)
  }

  getLastError() {
    return undefined
  }

  onTestResult(
    test: Test,
    testResult: TestResult,
    aggregatedResult: AggregatedResult
  ): void {
    this.#ipc.emit('testResult', {
      test,
      testResult,
      aggregatedResult,
    })
  }

  onTestFileResult(
    test: Test,
    testResult: TestResult,
    aggregatedResult: AggregatedResult
  ): void {
    this.#ipc.emit('testFileResult', {
      test,
      testResult,
      aggregatedResult,
    })
  }

  onTestCaseResult(test: Test, testCaseResult: TestCaseResult): void {
    this.#ipc.emit('testCaseResult', {
      test,
      testCaseResult,
    })
  }

  onRunStart(
    aggregatedResult: AggregatedResult,
    options: ReporterOnStartOptions
  ): void {
    this.#ipc.emit('runStart', {
      aggregatedResult,
      options,
    })
  }

  onTestStart(test: Test): void {
    this.#ipc.emit('testStart', { test })
  }

  onTestFileStart(test: Test): void {
    this.#ipc.emit('testFileStart', { test })
  }

  async onRunComplete(
    contexts: Set<Context>,
    results: AggregatedResult
  ): Promise<void> {
    this.#ipc.emit('runComplete', { contexts, results })

    await this.#onConnected
    await this.#ipc.disconnect()
  }
}
