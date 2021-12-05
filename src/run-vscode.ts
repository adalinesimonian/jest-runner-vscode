import type { RemoteTestOptions, RemoteTestResults } from './types'
import cp from 'child_process'
import console from 'console'
import type { IPC } from 'node-ipc'

export default async function runVSCode(
  vscodePath: string,
  args: string[],
  env: Record<string, string> | undefined,
  options: RemoteTestOptions,
  ipc: InstanceType<typeof IPC>
): Promise<RemoteTestResults | undefined> {
  return await new Promise<RemoteTestResults | undefined>(resolve => {
    let results: RemoteTestResults | undefined = undefined

    const useStdErr =
      options.globalConfig.json || options.globalConfig.useStderr
    const log = useStdErr ? console.error : console.log
    const silent = options.globalConfig.silent

    const environment = {
      ...process.env,
      ...env,
      PARENT_JEST_OPTIONS: JSON.stringify(options),
      IPC_CHANNEL: ipc.config.id,
    }

    const onTestResults = (response: RemoteTestResults) => {
      results = response
    }

    ipc.server.on('test-results', onTestResults)

    const vscode = cp.spawn(vscodePath, args, { env: environment })

    if (!silent) {
      vscode.stdout.pipe(process.stdout)
      vscode.stderr.pipe(process.stderr)
    }

    vscode.on('error', data => {
      results = { is: 'error', error: data, exitCode: null }
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
        if (results && results.is === 'error') {
          results.exitCode = exit
        } else {
          results = { is: 'error', error: new Error(message), exitCode: exit }
        }
      } else {
        silent || log(message)
      }

      ipc.server.off('test-results', onTestResults)

      resolve(results)
    }

    vscode.on('exit', onExit)
    vscode.on('close', onExit)
  })
}
