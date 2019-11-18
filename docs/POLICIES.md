# Policies

Policies are a declarative way to describe your organization's security recommendations for endpoint devices. The default policy for Stethoscope can be found in the practices directory [default policy](https://github.com/Netflix-Skunkworks/stethoscope-app/blob/master/practices/policy.yaml).

## Specifying Requirements

The specifics are explained in more detail below, but generally there are two main ways to express a requirement:

  * [Semver](https://semver.org/) string (or platform-specific semver strings)
  * `RequirementOption`

### Semver Strings

[Semver](https://semver.org/) (Semantic Versioning) is a common versioning practice that uses MAJOR.MINOR.PATCH format (e.g. 10.13.2). Semver supports comparisons and logical operators, and the policy allows any valid semver for comparison.

**platform-specific semver**

Some requirements (software versions, os verisons) are dependent on the platform. For these cases we have special GraphQL schemas defined:

```graphql
# specify one semver requirement per platform
input PlatformStringRequirement {
  darwin: Semver
  win32: Semver
  ubuntu: Semver
  linux: Semver
  all: Semver
}

# set bracketed (ok, nudge) requirements for platforms
input PlatformBracketRequirement {
  darwin: VersionBracket
  win32: VersionBracket
  ubuntu: VersionBracket
  linux: VersionBracket
  all: VersionBracket
}

# defines the acceptable range of versions
input VersionBracket {
  ok: Semver
  nudge: Semver
}
```

### RequirementOption

The `RequirementOption` enum contains the following `ALWAYS`, `SUGGESTED`, `NEVER`, `IF_SUPPORTED` [schema](https://github.com/Netflix-Skunkworks/stethoscope-app/blob/master/schema.graphql#L251-L256)

 If the requirement is `ALWAYS`, the user will only pass this practice if their setting is enabled

 If the requirement is `SUGGESTED`, the user will pass whether or not the setting is enabled, but will receive a nudge (yellow) suggesting they enable it.

 If the requirement is `NEVER`, the user will only pass if the setting is disabled.

 If the requirement is `IF_SUPPORTED`, the user will only pass if their platform supports the practice (and reliable querying of the practice)

## Understanding Responses

Scans return a JSON object with an overall status and individual practice status. Valid return values for a scan/practice are: `PASS`, `NUDGE`, and `FAIL`.

**Example Response**

```json
{
  "data": {
    "policy": {
      "validate": {
        "status": "PASS",
        "osVersion": "PASS",
        "firewall": "PASS",
        "diskEncryption": "PASS",
        "automaticUpdates": "PASS",
        "screenLock": "PASS",
        "remoteLogin": "PASS",
        "stethoscopeVersion": "PASS",
        "applications": [
          {
            "name": "Google Chrome",
            "status": "PASS"
          }
        ]
      }
    }
  }
}
```

---

## Supported Practices

### `osVersion`

OS Version allows you to specify what operation system version the user is running, based on the platform the app is running on.

The requirement is specified to each platform and uses `semver` strings to specify version cutoffs. If `ok` matches the user's os version, they will show as passing this practice. If `nudge` matches the user's os version, they will see a yellow warning. If the user's version doesn't match `ok` or `nudge`, they will be shown a red warning.

**Example os version policy (yaml)**

```yaml
osVersion:
  darwin:
    # High Sierra
    ok: ">=10.13.6"
    # Sierra
    nudge: ">=10.12.6"
  win32:
    # Version 1803 - Redstone 3 Fall Creators Update
    ok: ">=10.0.16299"
    # Version 1703 - Redstone 2 Creators Update
    nudge: ">=10.0.15063"
  ubuntu:
    ok: ">=18.4.0"
    nudge: ">=18.0.2"
```
**Example os version policy (JSON)**

```json
{
  "osVersion": {
    "darwin": {
      "ok": ">=10.13.6",
      "nudge": ">=10.12.6"
    },
    "win32": {
      "ok": ">=10.0.16299",
      "nudge": ">=10.0.15063"
    },
    "ubuntu": {
      "ok": ">=18.4.0",
      "nudge": ">=18.0.2"
    }
  },
}
```

You can use more complex semver strings if you want to warn on a specific OS version.

### `firewall`

Firewall checks the local firewall state using the default firewall provider in each platform (and `iptables` on linux). This practice uses the `RequirementOption` enum to specify the requirement.

Valid values are: `ALWAYS`, `SUGGESTED`, `NEVER`, `IF_SUPPORTED`

**Example Usage:**

```json
{
  "firewall": "ALWAYS"
}
```

### `diskEncryption`

Disk encryption enumerates mounted drives and checks their encryption status using FileVault (mac), BitLocker (windows), and LUKS (linux). This practice uses the `RequirementOption` enum to specify the requirement.

Valid values are: `ALWAYS`, `SUGGESTED`, `NEVER`, `IF_SUPPORTED`

**Example Usage:**

```json
{
  "diskEncryption": "ALWAYS"
}
```

### `automaticUpdates`

The automatic updates practice checks that the user has automatic updates enabled on their machine through `plist` values and service state (running). This practice uses the `RequirementOption` enum to specify the requirement.

Valid values are: `ALWAYS`, `SUGGESTED`, `NEVER`, `IF_SUPPORTED`

**Example Usage:**

```json
{
  "automaticUpdates": "SUGGESTED"
}
```

### `screenLock`

Does not work on El Capitan or higher as this setting was moved to the keychain and is not accessible. This practice uses the `RequirementOption` enum to specify the requirement.

Valid values are: `ALWAYS`, `SUGGESTED`, `NEVER`, `IF_SUPPORTED`

**Example Usage:**

```json
{
  "screenLock": "IF_SUPPORTED"
}
```

### `remoteLogin`

Checks that remote login (RDP, SSH) is disabled for the device. This practice uses the `RequirementOption` enum to specify the requirement.

Valid values are: `ALWAYS`, `SUGGESTED`, `NEVER`, `IF_SUPPORTED`

**Example Usage:**

```json
{
  "remoteLogin": "NEVER"
}
```

### `applications`

Application requirements have their own GraphQL schema:

```graphql
# Defines a requirement for an installed application

input ApplicationRequirement {
  name: String! # e.g. Slack.app
  paths: ApplicationPaths
  platform: PlatformStringRequirement
  version: Semver
  assertion: RequirementOption! # ALWAYS, NEVER, SUGGESTED, etc.
  description: String
  installFrom: String
}
```

`name` is the only required property. If you do not specify a platform filter, or specify `all: true` in your platform filter, the application requirement will be checked for all platforms. Since application package names, locations, and versions vary across platforms, you are advised to scope your application checks to the specific platforms you care about. You can specify requirements as an array of `ApplicationRequirements`. 

**Example Usage:**

```json
"applications": [
  {
    "name": "CommonApp",
    "description": "Should be checked for on all devices",
    "assertion": "SUGGESTED"
  },
  {
    "name": "Terminal",
    "description": "Terminal.app, present with all MacOS versions",
    "assertion": "ALWAYS",
    "platform": {
      "darwin": ">=10.0.0"
    }
  },
  {
    "name": "TV",
    "description": "TV.app, introduced with MacOS Catalina",
    "assertion": "ALWAYS",
    "platform": {
      "darwin": ">=10.15.0"
    },
    "paths": {
      "darwin": "/System/Applications"
    }
  },
  {
    "name": "bash",
    "description": "Bourne Again Shell",
    "assertion": "ALWAYS",
    "platform": {
      "linux": ">=12.04.0"
    }
  },
  {
    "name": "Notepad.exe",
    "description": "Default Win32 Editor",
    "assertion": "ALWAYS",
    "platform": {
      "win32": ">=10.0.0"
    }
  }
]
```

### `openWifiConnections`

NOTE: Currently supported on MacOS only

Checks if there are old wifi connections cached locally. This practice uses the `RequirementOption` enum to specify the requirement.

Valid values are: `ALWAYS`, `SUGGESTED`, `NEVER`, `IF_SUPPORTED`

**Example Usage:**

```json
{
  "openWifiConnections": "SUGGESTED"
}
```
