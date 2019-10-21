import semver from '../../lib/patchedSemver'
import Device from '../platform/WindowsDevice'
import kmd from '../../lib/kmd'
import { UNKNOWN, DEFAULT_WIN32_APP_REGISTRY_PATH } from '../../constants'

export default {
  async automaticUpdates (root, args, context) {
    const result = await kmd('automatic-updates', context)
    return result.automaticUpdatesNotificationLevel > 1
  },

  async remoteLogin (root, args, context) {
    const device = await kmd('os', context)
    // aws workspaces require remote login
    if (device.system.platform === 'awsWorkspace') {
      return false
    }

    const prefs = await kmd('remote-desktop', context)
    return prefs.sharingPreferences.remoteDesktopDisabled !== '1'
  },

  async diskEncryption (root, args, context) {
    const device = await kmd('os', context)
    // workspaces don't support disk encryption - bail
    if (device.system.platform === 'awsWorkspace') {
      return true
    }

    const disk = await kmd('encryption', context)

    if (disk.bitlockerStatus) {
      return disk.bitlockerStatus === 'ON'
    }
    return false
  },

  async screenLock (root, args, context) {
    const device = await kmd('os', context)
    // // screen lock creates problems in workspaces
    if (device.system.platform === 'awsWorkspace') {
      return UNKNOWN
    }

    const lock = await kmd('screenlock', context)
    const { windowsMaxScreenLockTimeout = 600 } = args
    const { chargingTimeout, batteryTimeout } = lock

    return (
      // According to Windows: 0 = Never
      chargingTimeout !== 0 &&
      batteryTimeout !== 0 &&
      chargingTimeout <= windowsMaxScreenLockTimeout &&
      batteryTimeout <= windowsMaxScreenLockTimeout
    )
  },

  async firewall (root, args, context) {
    const result = await kmd('firewall', context)
    return result.firewalls.every(fw => fw.status === 'ON')
  },

  async applications (root, args, context) {
    const device = await kmd('os', context)

    // gather set of optional registry path overrides from policy
    const overrides = new Set()
    args.applications.map(({ paths = {} }) => {
        overrides.add(paths.win32 || DEFAULT_WIN32_APP_REGISTRY_PATH)
    })

    const registry_paths = Array.from(overrides)

    let apps = []
    for (const path of registry_paths) {
      const variables = {
        REGISTRY_PATH: path
      }
      const discovered = await kmd('apps', context, variables)
      apps = apps.concat(discovered.apps)
    }

    const { version: osVersion } = device.system
    const { applications = [] } = args
    const devicePlatform = process.platform

    return applications.filter((app) => {
      const { platform = false } = app
      // if a platform is required
      if (platform) {
        if (platform[devicePlatform]) {
          return semver.satisfies(osVersion, platform[devicePlatform])
        }
        return platform.all
      }
      // no platform specified - default to ALL
      return true
    }).map(({
      exactMatch = false,
      name,
      version,
      platform
    }) => {
      let userApp = false

      if (!exactMatch) {
        userApp = apps.find((app) => (new RegExp(name, 'ig')).test(app.name))
      } else {
        userApp = apps.find((app) => app.name === name)
      }

      // app isn't installed
      if (!userApp) return { name, reason: 'NOT_INSTALLED' }
      // app is out of date
      if (version && !semver.satisfies(userApp.version, version)) {
        return { name, version: userApp.version, reason: 'OUT_OF_DATE' }
      }

      return { name, version: userApp.version }
    })
  }
}
