# Stethoscope Changelog

All notable changes to this project will be documented in this file.

## [Unreleased](#)

----

## [1.0.2](#) - 2018-04-10

-----

### Changed
- Updated `electron` and `electron-builder` dependencies to mitigate [CVE-2018-1000118](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-1000118)

## [1.0.1](#) - 2018-04-09

-----
### Added
- `nsp` dependency to check for vulnerabilities
- standardjs formatting

### Changed
- updated dependencies

### Fixed
- Stopped including osqueryi binaries for all platforms in build


## [1.0.0](https://github.com/Netflix/stethoscope-app/tree/1.0.0) - 2018-04-05

----

### Added
- Top level messaging on device status
- Added `SUGGESTED` to requirement options
- Support for NUDGE status
- Bracketing on OS version requirements in Policy
- Added `osName` and `osBuild` attributes to `Device` schema

### Changed
- *Breaking Change* Removed original `validate` and `validateWithDetails` queries and moved newer `validateV2` to `validate`
- Minimum required Mac version in default policy (10.13.3 -> 10.13.4)
- Update flow copy
- Removed unused code/resolvers and branching that was required by supporting multiple validation queries and results

### Fixed
- Commented logic in policy evaluation, simplified policy processing

## [0.3.2](https://github.com/Netflix/stethoscope-app/tree/0.3.2) - 2018-03-22

----

### Added
- `policyFormat` version an `version` to `instructions.yaml`
- PASS/FAIL titles instead of single title to individual instructions
- Support for NUDGE state, instead of just PASS/FAIL
- `validateV2` GraphQL endpoint that allows osVersion policy to be bracketed
- schemas to support updated osVersion policy format
- "active" state to scan button when non-passing item instructions are expanded

### Changed
- Aligned definitions and instructions with web Stethoscope

### Fixed
- osVerson now properly reports non-passing state

## [0.3.1](#) - 2018-03-16

----

### Added
- About screen for Windows

### Changed
- Removed ability to maximize and fullscreen application windows
- Signing instructions (previous were incorrect)
- Made "View all devices" link gray to not draw action

### Fixed
- Added missing PASS/FAIL status in device information
- Bad path for changelog file in production

## [0.3.0](#) - 2018-03-16

-----
### Added
- icon badge indicating number of policy violations (Mac/Windows)
- Changelog

### Changed
- Force use of the npm registry
- Additional MAC address filtering

### Fixed
- Fixed issue with Tray icon showing up multiple times in some instances
- Close graphql server only when app is quitting or on uncaughtException

## [0.2.11](#) - 2018-03-15

----
### Changed
- updated bundled osqueryi binaries from `2.9` to `2.11`
- MAC address filtering, removed local and multicast interfaces from list



The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).
