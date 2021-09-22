import type { RemoteTestOptions, RemoteTestResults } from './types'
import cp from 'child_process'
import console from 'console'
import readline from 'readline'

export default function runVSCode(
  vscodePath: string,
  args: string[],
  env: Record<string, string> | undefined,
  options: RemoteTestOptions
): Promise<RemoteTestResults | undefined> {
  return new Promise<RemoteTestResults | undefined>(resolve => {
    let results: RemoteTestResults | undefined = undefined

    const useStdErr =
      options.globalConfig.json || options.globalConfig.useStderr
    const log = useStdErr ? console.error : console.log
    const silent = options.globalConfig.silent

    const environment = {
      ...process.env,
      ...env,
      PARENT_JEST_OPTIONS: JSON.stringify(options),
    }

    const vscode = cp.spawn(vscodePath, args, { env: environment })

    const stdoutReader = readline.createInterface({
      input: vscode.stdout,
      terminal: true,
    })

    stdoutReader.on('line', line => {
      const output = line.replace(/^\[jest-runner-vscode\] .+$/, match => {
        results = JSON.parse(match.slice(21))
        return ''
      })
      silent || log(output)
    })

    if (!silent) {
      vscode.stderr.pipe(process.stderr)
    }

    vscode.on('error', data => {
      results = { is: 'error', error: data, exitCode: null }
    })

    let exited = false

    const onExit = (
      code: number | null,
      signal: NodeJS.Signals | null
    ): void => {
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
    }

    vscode.on('exit', onExit)
    vscode.on('close', onExit)

    stdoutReader.on('close', () => resolve(results))
  })
}
