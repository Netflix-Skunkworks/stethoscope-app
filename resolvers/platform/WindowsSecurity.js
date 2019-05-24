import semver from '../../src/lib/patchedSemver'
import Device from '../platform/WindowsDevice'
import kmd from '../../src/lib/kmd'
import { UNKNOWN } from '../../src/constants'

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
    const apps = await Device.applications(root, args, context)
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
      platform,
      // ignored for now
      includePackages
    }) => {
      let userApp = false

      if (!exactMatch) {
        userApp = apps.find((app) => (new RegExp(name, 'ig')).test(app.name))
      } else {
        userApp = apps.find((app) => app.name === name)
      }

      // app isn't installed - fail
      if (!userApp) return { name, passing: false, reason: 'NOT_INSTALLED' }
      // app is out of date - fail
      if (version && !semver.satisfies(userApp.version, version)) {
        return { name, passing: false, reason: 'OUT_OF_DATE' }
      }

      return { name, passing: true }
    })
  }
}
