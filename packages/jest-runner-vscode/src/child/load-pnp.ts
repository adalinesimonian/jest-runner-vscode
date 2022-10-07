// without any non-internal dependencies, try to find the pnp module and load it

import fs from 'fs/promises'
import module from 'module'
import path from 'path'
import process from 'process'
import vscode from 'vscode'

async function findPackageRoot(start: string): Promise<string | undefined> {
  let current = start
  while (current) {
    try {
      const yarnLockPath = await fs.realpath(path.join(current, 'yarn.lock'))
      const stat = await fs.stat(yarnLockPath)

      if (stat.isFile()) {
        return current
      }
    } catch {
      // ignore
    }
    current = path.dirname(current)
  }
  return undefined
}

async function findPnPLoader(dir: string): Promise<string | undefined> {
  for (const yarnPath of ['.pnp.cjs', '.pnp.js']) {
    try {
      const realPath = await fs.realpath(path.join(dir, yarnPath))
      const stat = await fs.stat(realPath)

      if (stat.isFile()) {
        return realPath
      }
    } catch {
      // ignore
    }
  }

  return undefined
}

export default async function loadPnP(): Promise<void> {
  const { PARENT_CWD } = process.env

  if (PARENT_CWD) {
    const root = await findPackageRoot(PARENT_CWD)

    if (root) {
      const loader = await findPnPLoader(root)

      if (loader) {
        try {
          // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
          ;(require(loader) as { setup: () => void }).setup()

          const pnpifiedModule = module.Module as typeof module.Module & {
            _load: (request: string) => unknown
          }

          const { _load } = pnpifiedModule
          pnpifiedModule._load = function (request: string) {
            if (request === 'vscode') {
              return vscode
            }
            return _load.apply(
              this,
              // eslint-disable-next-line prefer-rest-params
              arguments as unknown as Parameters<typeof _load>
            )
          }
        } catch {
          // ignore
        }
      }
    }
  }
}
