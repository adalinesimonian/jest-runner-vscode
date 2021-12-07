import type net from 'net'
import path from 'path'
import Message from 'js-message'
import type { IPC } from 'node-ipc'

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const EventParser = require(path.resolve(
  path.dirname(require.resolve('node-ipc')),
  'entities/EventParser'
)) as new (config: InstanceType<typeof IPC>['config']) => {
  format: (message: Message) => string
}

export default class MessageWriter {
  #ipc: InstanceType<typeof IPC>
  #eventParser: InstanceType<typeof EventParser>
  #channel: string

  constructor(ipc: InstanceType<typeof IPC>, channel: string) {
    this.#ipc = ipc
    this.#eventParser = new EventParser(this.#ipc.config)
    this.#channel = channel
  }

  public write(type: string, data: unknown): Promise<void> {
    const { socket } = this.#ipc.of[this.#channel] as unknown as {
      socket: net.Socket
    }
    const message = new Message()

    message.type = type
    message.data = data

    // Can't do this since it doesn't wait for the event to be sent:
    // this.#ipc.of[this.#ipcChannel].emit(method, param)

    return new Promise(res => {
      socket.write(this.#eventParser.format(message), () => res())
    })
  }
}
