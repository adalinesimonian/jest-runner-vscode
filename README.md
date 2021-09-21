# jest-runner-vscode

Runs extension tests in [VS Code] using [Jest].

> **Note**: This extension is in its early stages of development and is subject to change. Contributions and suggestions are welcome!

## Installation

```shell
$ yarn add -D jest-runner-vscode
```

or

```shell
$ npm i -D jest-runner-vscode
```

## Configuration

```js
// jest.config.js (or similar)

module.exports = {
  runner: 'vscode',
}
```

```js
// jest-runner-vscode.config.js

module.exports = {
  // optional, path to VS Code executable
  // if unspecified, downloads a copy of Code to use
  vscodeExecutablePath: '/path/to/code'

  // optional, version of Code to download
  // ('insiders', 'stable', or version tags '1.56.2', etc.)
  version: '1.56.2',

  // optional, platform to download Code for
  // ('darwin', 'win32-archive', 'win32-x64-archive', or 'linux-x64')
  platform: 'linux-x64',

  // optional, environment variables to pass to tests
  extensionTestsEnv: {
    'FOO_BAR': 'baz',
  },

  // optional, additional arguments to pass to VS Code
  launchArgs: [
    '--new-window',
    '--disable-extensions',
  ],

  // optional, absolute path to the extension root
  // (where the extension's package.json lives)
  // defaults to the jest config's rootDir
  extensionDevelopmentPath: '/path/to/extension',

  // optional, directory in which to open VS Code
  // (used if openInFolder is true)
  // defaults to the folder containing the test file
  workspaceDir: 'path/to/workspace',

  // optional, whether or not to open Code in a folder
  openInFolder: true,
}
```

Configuration files in nested folders inherit the parent folder's configuration.

## Behaviour

- Tests are run sequentially.
- A single instance of VS Code is launched for each unique directory containing tests. This allows you to save time for test suites that do not require relaunching the editor. Example:

  ```text
  /path/to/project/lib/__tests__/foo.test.js
  /path/to/project/lib/__tests__/bar.test.js
    --> run in the same instance

  /path/to/project/src/__tests__/foo.test.js
  /path/to/project/3rd-party/__tests__/bar.test.js
    --> run in separate instances
  ```

## Things not yet supported

- Collecting coverage
- Colourized output
- more stuff I haven't encountered yet — if you run into anything that doesn't work, [open an issue]!

## Licence

[ISC](LICENCE)

[vs code]: https://code.visualstudio.com/
[jest]: https://jestjs.io/
[open an issue]: https://github.com/adalinesimonian/jest-runner-vscode/issues/new
