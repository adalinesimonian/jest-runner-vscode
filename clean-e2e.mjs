'use strict'

import path from 'path'
import url from 'url'
import glob from 'fast-glob'
import fs from 'fs-extra'

const items = await glob(['e2e/*/(yarn.lock|.vscode-test|.pnp.cjs)'], {
  cwd: path.dirname(url.fileURLToPath(import.meta.url)),
  dot: true,
  onlyFiles: false,
  absolute: true,
  followSymbolicLinks: false,
})

for (const item of items) {
  await fs.remove(item)
}
