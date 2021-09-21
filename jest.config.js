/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    'node_modules/variables/.+\\.(j|t)sx?$': 'ts-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/.+/__tests__'],
  transformIgnorePatterns: ['node_modules/(?!variables/.*)'],
  modulePathIgnorePatterns: ['.vscode-test/'],
}

module.exports = config
