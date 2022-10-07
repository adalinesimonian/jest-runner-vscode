import type { RemoteTestOptions } from '../types'
import { runCLI } from '@jest/core'
import type { Config } from '@jest/types'
import vscode from 'vscode'
import path from 'path'
import process from 'process'
import IPCClient from './ipc-client'

const vscodeTestEnvPath = require.resolve('./environment')
const vscodeModulePath = require.resolve('./vscode-module')
const moduleNameMapper = JSON.stringify({ '^vscode$': vscodeModulePath })

const jestCliPath = require.resolve('jest-cli')
// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const { buildArgv } = require(path.join(jestCliPath, '../cli')) as {
  buildArgv: (maybeArgv?: Array<string>) => Promise<Config.Argv>
}

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
    const options = JSON.parse(PARENT_JEST_OPTIONS) as RemoteTestOptions
    const jestOptions = [
      ...options.args,
      '-i',
      '--colors',
      '--runner=jest-runner',
      `--env=${vscodeTestEnvPath}`,
      `--moduleNameMapper=${moduleNameMapper}`,
      `--reporters=${require.resolve('./reporter')}`,
      '--runTestsByPath',
      ...options.testPaths,
    ]
    const argv = await buildArgv(jestOptions)
    const projects = new Set([
      ...(argv.projects?.map(project => path.resolve(project)) || []),
      options.workspacePath,
    ])

    await runCLI(argv, [...projects])
  } catch (error: unknown) {
    console.log(
      (error as Error).stack || (error as Error).message || String(error)
    )
    const errorObj = JSON.parse(
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    ) as Error
    ipc.emit('error', errorObj)
  }

  await Promise.race([disconnected, ipc.disconnect()])
}
