import path from 'path'
import url from 'url'
import { cosmiconfig } from 'cosmiconfig'
import downloadVSCode from './dist/download-vscode.js'

const e2ePath = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  'e2e'
)

/** @type {import('./src/types').RunnerOptions} */
const options =
  (await cosmiconfig('jest-runner-vscode').search(e2ePath))?.config ?? {}

await downloadVSCode.default(options.version, options.platform)
