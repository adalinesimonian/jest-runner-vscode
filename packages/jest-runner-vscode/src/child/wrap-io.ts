import util from 'util'
import IPCClient from './ipc-client'
import actualConsole from 'console'
import { Global } from '@jest/types'

export default function wrapIO(
  client: IPCClient,
  globalObject: typeof globalThis | Global.Global = global
) {
  const consolePrintMethods: (keyof Console)[] = [
    'log',
    'info',
    'warn',
    'error',
  ]
  const actualProperties = Object.getOwnPropertyDescriptors(actualConsole)

  consolePrintMethods.forEach(method => {
    Object.defineProperty(globalObject.console, method, {
      value: (...args: unknown[]) => {
        const event =
          method === 'error' || method === 'warn' ? 'stderr' : 'stdout'
        const formatted = util.format(...args)

        client.emit(event, formatted)
      },
    })
  })

  Object.defineProperty(globalObject.console, 'dir', {
    value: (...args: Parameters<typeof util.inspect>) => {
      const formatted = util.inspect(...args)

      client.emit('stdout', formatted)
    },
  })

  const onDisconnect = () => {
    ;[...consolePrintMethods, 'dir'].forEach(method => {
      Object.defineProperty(
        globalObject.console,
        method,
        actualProperties[method]
      )
    })
  }

  client.once('disconnect', onDisconnect)
}
