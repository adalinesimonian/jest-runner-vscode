import type { RemoteTestOptions, RemoteTestResults } from './types'
import * as jest from '@jest/core'
import type { buildArgv as buildArgvType } from 'jest-cli/build/cli/index'
import vscode from 'vscode'
import path from 'path'
import process from 'process'
import { IPC } from 'node-ipc'
import console from 'console'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const buildArgv: typeof buildArgvType = require(path.resolve(
  path.dirname(require.resolve('jest-cli')),
  'cli/index.js'
)).buildArgv

const vscodeTestEnvPath = require.resolve('./jest-vscode-env')
const vscodeModulePath = require.resolve('./jest-vscode-module')
const moduleNameMapper = JSON.stringify({ '^vscode$': vscodeModulePath })

export async function run(): Promise<void> {
  const { IPC_CHANNEL, PARENT_JEST_OPTIONS } = process.env

  if (!IPC_CHANNEL) {
    throw new Error('IPC_CHANNEL is not defined')
  }

  const ipc = new IPC()

  ipc.config.silent = true
  ipc.config.id = `jest-runner-vscode-client-${process.pid}`

  await new Promise<void>(resolve =>
    ipc.connectTo(IPC_CHANNEL, () => {
      ipc.of[IPC_CHANNEL].on('connect', () => {
        console.log(`Connected to ${IPC_CHANNEL}`)
        resolve()
      })
    })
  )

  const disconnected = new Promise<void>(resolve =>
    ipc.of[IPC_CHANNEL].on('disconnect', resolve)
  )

  let response: RemoteTestResults
  try {
    if (!PARENT_JEST_OPTIONS) {
      throw new Error('PARENT_JEST_OPTIONS is not defined')
    }
    const options: RemoteTestOptions = JSON.parse(PARENT_JEST_OPTIONS)

    const jestOptions = buildArgv([
      '-i',
      '--colors',
      '--runner=jest-runner',
      `--env=${vscodeTestEnvPath}`,
      `--moduleNameMapper=${moduleNameMapper}`,
      ...(options.globalConfig.updateSnapshot === 'all' ? ['-u'] : []),
      '--runTestsByPath',
      ...options.testPaths,
    ])

    const { results } =
      (await jest.runCLI(jestOptions, [options.globalConfig.rootDir])) ?? {}

    response = {
      is: 'ok',
      results,
    }
  } catch (error: any) {
    const errorObj = JSON.parse(
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    )
    response = {
      is: 'error',
      error: errorObj,
    }
  }

  ipc.of[IPC_CHANNEL].emit('test-results', response)
  ipc.disconnect(IPC_CHANNEL)
  await disconnected
  await vscode.commands.executeCommand('workbench.action.closeWindow')
}
