import NodeEnvironment from 'jest-environment-node'
import vscode from 'vscode'

class VSCodeEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup()
    this.global.vscode = vscode
  }

  async teardown() {
    this.global.vscode = {}
    await super.teardown()
  }
}

module.exports = VSCodeEnvironment
