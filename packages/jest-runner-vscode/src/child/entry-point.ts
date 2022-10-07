import loadPnP from './load-pnp'

export async function run(): Promise<void> {
  await loadPnP()
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  await (require('./runner') as typeof import('./runner')).run()
}
