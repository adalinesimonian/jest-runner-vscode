import NodeEnvironment from 'jest-environment-node'
import vscode from 'vscode'
import IPCClient from './ipc-client'
import wrapIO from './wrap-io'
import loadPnP from './load-pnp'

const ipc = new IPCClient('env')

class VSCodeEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup()
    await loadPnP()
    this.global.vscode = vscode
    await ipc.connect()
    await wrapIO(ipc, this.global)
  }

  async teardown() {
    this.global.vscode = {}
    await ipc.disconnect()
    await super.teardown()
  }
}

module.exports = VSCodeEnvironment
