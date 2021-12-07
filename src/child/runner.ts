import type { RemoteTestOptions } from '../types'
import * as jest from '@jest/core'
import type { buildArgv as buildArgvType } from 'jest-cli/build/cli/index'
import vscode from 'vscode'
import path from 'path'
import process from 'process'
import IPCClient from './ipc-client'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const buildArgv: typeof buildArgvType = require(path.resolve(
  path.dirname(require.resolve('jest-cli')),
  'cli/index.js'
)).buildArgv

const vscodeTestEnvPath = require.resolve('./environment')
const vscodeModulePath = require.resolve('./vscode-module')
const moduleNameMapper = JSON.stringify({ '^vscode$': vscodeModulePath })

export async function run(): Promise<void> {
  const ipc = new IPCClient('child')

  const disconnected = new Promise<void>(resolve =>
    ipc.on('disconnect', resolve)
  )

  try {
    const { PARENT_JEST_OPTIONS } = process.env

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
      `--reporters=${require.resolve('./reporter')}`,
      ...(options.globalConfig.updateSnapshot === 'all' ? ['-u'] : []),
      '--runTestsByPath',
      ...options.testPaths,
    ])

    await jest.runCLI(jestOptions, [options.globalConfig.rootDir])
  } catch (error: any) {
    const errorObj = JSON.parse(
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    )
    ipc.emit('error', errorObj)
  }

  await Promise.race([disconnected, ipc.disconnect()])
  await vscode.commands.executeCommand('workbench.action.closeWindow')
}
