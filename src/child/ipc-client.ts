import console from 'console'
import EventEmitter from 'events'
import { IPC } from '@achrinza/node-ipc'
import MessageWriter from './message-writer'

export default class IPCClient {
  #ipc: InstanceType<typeof IPC>
  #ipcChannel: string
  #messageQueue: Array<[string, unknown]> = []
  #writer: MessageWriter
  #connected = false
  #promises: Set<Promise<void>> = new Set()
  #emitter: EventEmitter = new EventEmitter()

  get on(): EventEmitter['on'] {
    return this.#emitter.on.bind(this.#emitter)
  }

  get once(): EventEmitter['once'] {
    return this.#emitter.once.bind(this.#emitter)
  }

  get off(): EventEmitter['off'] {
    return this.#emitter.off.bind(this.#emitter)
  }

  get removeListener(): EventEmitter['removeListener'] {
    return this.#emitter.removeListener.bind(this.#emitter)
  }

  get removeAllListeners(): EventEmitter['removeAllListeners'] {
    return this.#emitter.removeAllListeners.bind(this.#emitter)
  }

  constructor(id: string) {
    const { IPC_CHANNEL, DEBUG_VSCODE_IPC } = process.env

    if (!IPC_CHANNEL) {
      throw new Error('IPC_CHANNEL is not defined')
    }

    this.#ipcChannel = IPC_CHANNEL

    this.#ipc = new IPC()
    this.#ipc.config.silent = !DEBUG_VSCODE_IPC
    this.#ipc.config.id = `jest-runner-vscode-${id}-${process.pid}`
    this.#ipc.config.logger = (message: string) => {
      // keep message no longer than 500 characters
      const truncatedMessage =
        message.length > 500 ? `${message.slice(0, 500)}...\u001b[0m` : message

      console.log(truncatedMessage)
    }

    this.#writer = new MessageWriter(this.#ipc, this.#ipcChannel)
  }

  async #flush(): Promise<void> {
    while (this.#messageQueue.length) {
      const message = this.#messageQueue.shift()

      if (message) {
        const [type, data] = message

        await this.#writer.write(type, data)

        this.#emitter.emit(type, data)
      }
    }
  }

  async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.#ipc.connectTo(this.#ipcChannel, () => {
        this.#connected = true

        this.#flush()
          .then(() => {
            this.#emitter.emit('connect')

            this.#ipc.of[this.#ipcChannel].on('disconnect', () => {
              this.#connected = false
              this.#emitter.emit('disconnect')
            })

            resolve()
          })
          .catch(error => {
            reject(error)
          })
      })
    })
  }

  async disconnect(): Promise<void> {
    if (!this.#connected) {
      return
    }

    await Promise.all(this.#promises)

    const disconnected = new Promise<void>(resolve => {
      this.#emitter.once('disconnect', resolve)
    })

    this.#ipc.disconnect(this.#ipcChannel)

    return disconnected
  }

  emit(type: string, data: unknown): void {
    if (!this.#connected) {
      this.#messageQueue.push([type, data])
    } else {
      const promise = this.#writer.write(type, data)

      this.#promises.add(promise)
      promise.then(() => this.#promises.delete(promise)).catch(() => undefined)
    }
  }
}
