import path from 'path'
import url from 'url'
import { cosmiconfig } from 'cosmiconfig'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import downloadVSCode from './packages/jest-runner-vscode/dist/download-vscode.js'

const e2ePath = path.resolve(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  path.dirname(url.fileURLToPath(import.meta.url)),
  'e2e'
)

/** @type {import('./packages/jest-runner-vscode/src/types').RunnerOptions} */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const options =
  (await cosmiconfig('jest-runner-vscode').search(e2ePath))?.config ?? {}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
await downloadVSCode.default(options.version, options.platform)
