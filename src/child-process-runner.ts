import type { RemoteTestOptions, RemoteTestResults } from './types'
import * as jest from '@jest/core'
import console from 'console'
import vscode from 'vscode'
import path from 'path'
import type { buildArgv as buildArgvType } from 'jest-cli/build/cli/index'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const buildArgv: typeof buildArgvType = require(path.resolve(
  path.dirname(require.resolve('jest-cli')),
  'cli/index.js'
)).buildArgv

const vscodeTestEnvPath = require.resolve('./jest-vscode-env')
const vscodeModulePath = require.resolve('./jest-vscode-module')
const moduleNameMapper = JSON.stringify({ '^vscode$': vscodeModulePath })

export async function run(): Promise<void> {
  let response: RemoteTestResults
  try {
    if (!process.env.PARENT_JEST_OPTIONS) {
      throw new Error('PARENT_JEST_OPTIONS is not defined')
    }
    const options: RemoteTestOptions = JSON.parse(
      process.env.PARENT_JEST_OPTIONS
    )

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

  console.log(`[jest-runner-vscode] ${JSON.stringify(response)}\n`)

  await vscode.commands.executeCommand('workbench.action.closeWindow')
}
