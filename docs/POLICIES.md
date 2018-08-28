# Policies

Policies are a declarative way to describe your organization's security recommendations for endpoint devices. The default policy for Stethoscope can be found in the practices directory [default policy](https://github.com/Netflix-Skunkworks/stethoscope-app/blob/master/practices/policy.yaml).

Though [osquery](https://osquery.io/) (the main mechanism Stethoscope uses to query device details) provides read access to [most aspects of a device](https://osquery.io/schema/3.2.6), we have chosen to disallow raw queries and limit queries to a predefined set of attributes and schemas to prevent potential abuse.

If you would like access to data that osquery provides but Stethoscope does not, please file an issue.

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
        "requiredApplications": [
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

### `os version` (yaml) | `osVersion` (json)

OS Version allows you to specify what operation system version the user is running, based on the platform the app is running on.

The requirement is specified to each platform and uses `semver` strings to specify version cutoffs. If `ok` matches the user's os version, they will show as passing this practice. If `nudge` matches the user's os version, they will see a yellow warning. If the user's version doesn't match `ok` or `nudge`, they will be shown a red warning.

**Example os version policy (yaml)**

```yaml
os version:
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

### `firewall` (yaml) | `firewall` (json)

Firewall checks the local firewall state using the default firewall provider in each platform (and `iptables` on linux). This practice uses the `RequirementOption` enum to specify the requirement.

Valid values are: `ALWAYS`, `SUGGESTED`, `NEVER`, `IF_SUPPORTED`

**Example Usage:**

```json
{
  "firewall": "ALWAYS"
}
```

### `disk encryption` (yaml) | `diskEncryption` (json)

Disk encryption enumerates mounted drives and checks their encryption status using FileVault (mac), BitLocker (windows), and LUKS (linux). This practice uses the `RequirementOption` enum to specify the requirement.

Valid values are: `ALWAYS`, `SUGGESTED`, `NEVER`, `IF_SUPPORTED`

**Example Usage:**

```json
{
  "diskEncryption": "ALWAYS"
}
```

### `automatic updates` (yaml) | `automaticUpdates` (json)

The automatic updates practice checks that the user has automatic updates enabled on their machine through `plist` values and service state (running). This practice uses the `RequirementOption` enum to specify the requirement.

Valid values are: `ALWAYS`, `SUGGESTED`, `NEVER`, `IF_SUPPORTED`

**Example Usage:**

```json
{
  "automaticUpdates": "SUGGESTED"
}
```

### `screen lock` (yaml) | `screenLock` (json)

Does not work on El Capitan or higher as this setting was moved to the keychain and is not accessible. This practice uses the `RequirementOption` enum to specify the requirement.

Valid values are: `ALWAYS`, `SUGGESTED`, `NEVER`, `IF_SUPPORTED`

**Example Usage:**

```json
{
  "screenLock": "IF_SUPPORTED"
}
```

### `remote login` (yaml) | `remoteLogin` (json)

Checks that remote login (RDP, SSH) is disabled for the device. This practice uses the `RequirementOption` enum to specify the requirement.

Valid values are: `ALWAYS`, `SUGGESTED`, `NEVER`, `IF_SUPPORTED`

**Example Usage:**

```json
{
  "remoteLogin": "NEVER"
}
```

### `required applications` (yaml) | `requiredApplications` (json)

Application requirements have their own GraphQL schema:

```graphql
# Defines a requirement for an installed application
input AppRequirement {
  # required application name
  name: String!
  # optional application version requirement
  version: Semver
  # optional platform if only required for specific OS
  platform: PlatformStringRequirement
  # controls whether regex or equality check is performed against application name
  exactMatch: Boolean
  # controls whether bin packages are checked (homebrew, chocolatey, etc)
  includePackages: Boolean
  # install URL
  url: String
  # explanation to show user
  description: String
}
```

`name` is the only required property. You can specify requirements as an array of `AppRequirements`.

**Example Usage:**

```json
{
  "requiredApplications": [{
    "name": "Google Chrome",
    "version": ">=68.0.3440",
    "url": "https://www.google.com/chrome/",
    "description": "Google Chrome is a secure browser..."
  }]
}
```
