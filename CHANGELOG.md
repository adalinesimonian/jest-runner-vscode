# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v2.2.0](https://github.com/adalinesimonian/jest-runner-vscode/compare/v2.1.0...v2.2.0) (2021-12-07)

### Added

- Environments using Yarn PnP are now supported. ([#46](https://github.com/adalinesimonian/jest-runner-vscode/pull/46))
- All options from the parent Jest runner are now passed to the child runner. ([`f300e64`](https://github.com/adalinesimonian/jest-runner-vscode/commit/f300e64))
- VS Code process information and download progress can now be suppressed using the `quiet` option. ([`f300e64`](https://github.com/adalinesimonian/jest-runner-vscode/commit/f300e64))

### Changed

- A less internal API is now used to start the child instance of Jest. ([`6196f24`](https://github.com/adalinesimonian/jest-runner-vscode/commit/6196f24))

### Fixed

- Tests in nested directories no longer result in the runner expecting and failing tests from a different directory that are not yet queued. ([`f300e64`](https://github.com/adalinesimonian/jest-runner-vscode/commit/f300e64))

## [v2.1.0](https://github.com/adalinesimonian/jest-runner-vscode/compare/v2.0.0...v2.1.0) (2021-12-05)

### Added

- Test results are now reported per test file instead of per folder. ([#26](https://github.com/adalinesimonian/jest-runner-vscode/issues/26))
- Console output can now be filtered to output made by tests that use `console.log`, `.error`, `.warn`, `.info`, or `.dir`. ([#43](https://github.com/adalinesimonian/jest-runner-vscode/pull/43))

### Changed

- Communication between VS Code and Jest is now handled using an IPC channel instead of using the standard output of the VS Code process. ([`0c98677`](https://github.com/adalinesimonian/jest-runner-vscode/commit/0c98677))

## [v2.0.0](https://github.com/adalinesimonian/jest-runner-vscode/tree/v2.0.0) (2021-09-22)

First release of jest-runner-vscode! 🎉

[Commit History](https://github.com/adalinesimonian/jest-runner-vscode/commits/v2.0.0)
