/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  runner: 'vscode',
  reporters: ['../jest-silent-reporter.js'],
  modulePathIgnorePatterns: ['.vscode-test/'],
}

module.exports = config
