# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v3.0.1](https://github.com/adalinesimonian/jest-runner-vscode/compare/v3.0.0...v3.0.1) (2022-10-22)

### Fixed

- Non-Yarn workspaces no longer result in a stall due to an infinite loop. ([`af87fa7`](https://github.com/adalinesimonian/jest-runner-vscode/commit/af87fa7))
- Corrected path to `buildArgv` function in `jest-cli` dependency after it was moved in Jest 29.2.1. ([`7ac716a`](https://github.com/adalinesimonian/jest-runner-vscode/commit/7ac716a))

## [v3.0.0](https://github.com/adalinesimonian/jest-runner-vscode/compare/v2.2.0...v3.0.0) (2022-10-07)

### Breaking Changes

- Dropped support for Node.js 14.x and 16.13.x, VS Code <1.71.0, and Jest <29.0.0. ([`f779c3a`](http://github.com/adalinesimonian/jest-runner-vscode/commit/f779c3a))

### Changed

- The VS Code extension host is no longer killed when the test run is finished. ([`91d6743`](http://github.com/adalinesimonian/jest-runner-vscode/commit/91d6743))
- The package now specifies to Yarn that it should be unplugged to allow VS Code to start using the package's entry point in a PnP environment. ([`bf17692`](http://github.com/adalinesimonian/jest-runner-vscode/commit/bf17692))

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
