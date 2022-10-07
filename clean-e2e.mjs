'use strict'

import path from 'path'
import url from 'url'
import glob from 'fast-glob'
import fs from 'fs-extra'

const items = await glob(['e2e/*/jest-output.json'], {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  cwd: path.dirname(url.fileURLToPath(import.meta.url)),
  dot: true,
  onlyFiles: false,
  absolute: true,
  followSymbolicLinks: false,
})

await Promise.all(items.map(item => fs.remove(item)))
