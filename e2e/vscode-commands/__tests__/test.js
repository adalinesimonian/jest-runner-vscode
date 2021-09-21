const path = require('path')
const { commands, Uri, workspace, window } = require('vscode')

const docPath = path.resolve(__dirname, '../test.json')

describe('Describe', () => {
  it('should test', async () => {
    await expect(
      commands.executeCommand('vscode.openFolder', Uri.file(__dirname))
    ).resolves.toBeUndefined()

    const doc = await workspace.openTextDocument(docPath)
    await window.showTextDocument(doc)

    expect(doc.getText()).toMatchSnapshot()
  })
})
