# jest-runner-vscode

[![Build Status](https://github.com/adalinesimonian/jest-runner-vscode/actions/workflows/main-test.yml/badge.svg?branch=main)][build status] [![npm Version](https://img.shields.io/npm/v/jest-runner-vscode.svg)][npm] [![Change Log](https://img.shields.io/badge/Change%20Log-grey.svg)][change log]

Runs extension tests in [VS Code] using [Jest]. _Used by the official [Stylelint VS Code extension]!_

> **Note**: This runner is in its early stages of development and is subject to change. Contributions and suggestions are welcome!

> **Note**: Versions 1.x and earlier of this package on npm are an entirely different package, a library for running jest within a VS Code process, that was moved to [vscode-jest-test-runner]. The library under the old name was kept on npm so that existing projects don't break their test runs, but it is no longer maintained.
>
> If you are using the old version of the npm package, either migrate to this Jest runner or switch your dependencies to the [vscode-jest-test-runner] package.

## Installation

Requires [Node.js] 16.14 or later. Project is tested on VS Code 1.71.1.

```shell
$ yarn add -D jest-runner-vscode
```

or

```shell
$ npm i -D jest-runner-vscode
```

## Configuration

> See the [public types](src/public-types.ts) for details on all available configuration options.

```js
// jest.config.js (or similar)

module.exports = {
  runner: 'vscode',
}
```

```js
// jest-runner-vscode.config.js

/** @type {import('jest-runner-vscode').RunnerOptions} */
module.exports = {
  version: '1.71.1',
  extensionTestsEnv: {
    FOO_BAR: 'baz',
  },
  launchArgs: ['--new-window', '--disable-extensions'],
  workspaceDir: 'path/to/workspace',
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

[build status]: https://github.com/adalinesimonian/jest-runner-vscode/actions/workflows/main-test.yml
[npm]: https://www.npmjs.com/package/jest-runner-vscode
[change log]: CHANGELOG.md
[vs code]: https://code.visualstudio.com/
[stylelint vs code extension]: https://github.com/stylelint/vscode-stylelint
[jest]: https://jestjs.io/
[vscode-jest-test-runner]: https://github.com/bmealhouse/vscode-jest-test-runner
[node.js]: https://nodejs.org/
[open an issue]: https://github.com/adalinesimonian/jest-runner-vscode/issues/new/choose
