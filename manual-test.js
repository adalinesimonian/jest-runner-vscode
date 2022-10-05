const { IPC } = require('@achrinza/node-ipc')
const runVSCode = require('./dist/run-vscode').default

const ipc = new IPC()

ipc.config.silent = false
ipc.config.id = 'jest-runner-vscode-server-test'

const run = async () => {
  await new Promise(resolve => {
    ipc.serve(resolve)
    ipc.server.start()
  })

  const logAll = (...args) => console.log(args)
  const vscodePath =
    'C:\\Users\\adaline.simonian\\github\\adalinesimonian\\jest-runner-vscode\\.vscode-test\\vscode-win32-x64-archive-1.66.2\\Code.exe'
  const args = [
    '-n',
    '--no-sandbox',
    '--disable-workspace-trust',
    '--extensionDevelopmentPath=C:\\Users\\adaline.simonian\\github\\adalinesimonian\\jest-runner-vscode\\e2e\\passing-tests',
    `--extensionTestsPath=${require.resolve('./dist/child/entry-point')}`,
    'C:\\Users\\adaline.simonian\\github\\adalinesimonian\\jest-runner-vscode\\e2e\\passing-tests',
  ]

  await runVSCode({
    vscodePath,
    args,
    jestArgs: process.argv.slice(2),
    env: {},
    tests: [],
    globalConfig: {},
    filterOutput: false,
    onStart: logAll,
    onResult: logAll,
    onFailure: logAll,
    ipc,
    quiet: false,
  })

  ipc.server.stop()
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
