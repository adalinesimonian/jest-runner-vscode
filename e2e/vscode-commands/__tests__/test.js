const path = require('path')
const { commands, workspace, window } = require('vscode')

const docPath = path.resolve(__dirname, '../test.json')

describe('Describe', () => {
  it('should test', async () => {
    const doc = await workspace.openTextDocument(docPath)
    await window.showTextDocument(doc)

    expect(doc.getText()).toMatchSnapshot()

    await expect(
      commands.executeCommand('editor.action.selectAll')
    ).resolves.toBeUndefined()

    await expect(
      commands.executeCommand('editor.action.clipboardCopyAction')
    ).resolves.toBeUndefined()

    await expect(
      commands.executeCommand('cursorRight')
    ).resolves.toBeUndefined()

    await expect(
      commands.executeCommand('editor.action.clipboardPasteAction')
    ).resolves.toBeUndefined()

    expect(doc.getText()).toMatchSnapshot()
  })
})
