# Stethoscope Changelog

All notable changes to this project will be documented in this file.

## [3.0.6](https://github.com/Netflix-Skunkworks/stethoscope-app/tree/v3.0.6)

### Fixed
- kmd disk script (moved to `tryExec` to prevent failures)
- Crash when update is triggered after window is destroyed
- Screenlock regex on Windows

### Added
- Users can now copy debug info from Help menu

----

## [3.0.5](https://github.com/Netflix-Skunkworks/stethoscope-app/tree/v3.0.5)

### Fixed
- kmd requiring node to be installed on user's machine
- Lack of proper error handling when scan fails
- Timing destructuring error
- Issue reading logs when files haven't been created
- Update Electron to 2.0.18 to fix security issue
- Semver parsing issue

### Added
- Debugger app link - [stethoscope://debugger](stethoscope://debugger)
- AWS Workspace support
- Auto-expand first failing item

----

## [3.0.1](https://github.com/Netflix-Skunkworks/stethoscope-app/tree/v3.0.1)

### Removed
- OSquery dependency, it's been a good run, but not a great fit for our use-case. We switched to [`kmd`](https://github.com/Netflix-Skunkworks/kmd)

----

## [2.1.0](https://github.com/Netflix-Skunkworks/stethoscope-app/tree/v2.1.0)

### Fixed
- upstream auto update issue ([electron issue](https://github.com/electron-userland/electron-builder/issues/3269))

### Added
- Thrift connection pooling
- Support for AWS workstations
- Scan duration to UI
- Automated testing for builds

----

## [2.0.6](https://github.com/Netflix-Skunkworks/stethoscope-app/tree/v2.0.6)

### Fixed
- Stop binding to 'localhost' for node server, now explicitly bound to 127.0.0.1 to prevent host override issues
- emit `scan:init` event on server, even if policy is not a string
- updated react-dev-tools (vuln)
- fixed cache timing issue, now auto expire cache once it is not in use

### Changed
- **changed method of checking disk encryption on mac to using `fdestatus` instead of osquery**
- Removed unused Applescript import from MacSecurity resolver
- quiet down verbose debug logging in osquery
- optimize general queries that do not change between requests (run once)
- differentiate main app errors with specific handlers

### Added
- Added version to app title to minimize users having to hunt the info down.
- Added minimum rescan time
- Added version to error page
- Added error serialization to make logs less useless

----

## [2.0.5](https://github.com/Netflix-Skunkworks/stethoscope-app/tree/v2.0.5) - 2018-09-05

### Fixes
- Resolves Mojave instructions issue

### Added
- Support for querying Browser instructions documentation

----

## [2.0.3](https://github.com/Netflix-Skunkworks/stethoscope-app/tree/v2.0.3) - 2018-08-29

-----

### Changed
- Stethoscope is now a tray/menubar only application!
- Normalized practice names to camelCase between `yaml` and `json`
- Closing window collapses app to menubar/tray instead of quitting
- Improved logging

### Added
- Automatic scanning (weekly scan by default) - controlled by `rescanIntervalSeconds` in [src/config.json](src/config.json)
- Basic support for internationalization (practices.{LANGUAGE_CODE}.yaml)
- Documentation around policies
- New Mac device versions
- Instructions now display dynamic content via handlebars preprocessing
- Production debugging capabilities
- Basic linux support (requires `root`)

### Fixed
- Improved thrift connection stability and removed magic numbers/timing
- Windows not properly terminating osqueryd on close

## [1.2.0](https://github.com/Netflix-Skunkworks/stethoscope-app/tree/1.2.0) - 2018-07-29

-----

### Changed
- Updated to use thrift socket via osqueryd rather than shelling out to osqueryi
- startup order of operations, now wait for osqueryd to spawn before bootstrapping browser window and express server

### Added
- request-level caching and timing data for powershell commands
- `cross-env` dep to simplify env var handling

### Fixed
- issue with semver mishandling
- vulnerability from drag and drop links

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


## [1.0.0](https://github.com/Netflix-Skunkworks/stethoscope-app/tree/1.0.0) - 2018-04-05

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

## [0.3.2](https://github.com/Netflix-Skunkworks/stethoscope-app/tree/0.3.2) - 2018-03-22

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
