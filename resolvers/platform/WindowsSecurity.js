const semver = require('../../src/lib/patchedSemver')
const Device = require('../platform/WindowsDevice')
const pkg = require('../../package.json')
const { NUDGE, UNKNOWN } = require('../../src/constants')

const WindowsSecurity = {
  async automaticUpdates (root, args, { kmdResponse }) {
    return kmdResponse.automaticUpdatesNotificationLevel > 1
  },

  async remoteLogin (root, args, { kmdResponse }) {
    // // aws workspaces require remote login
    // if (info.version.includes('amazon')) {
    //   return false
    // }
    return kmdResponse.sharingPreferences.remoteDesktopDisabled !== '1'
  },

  async diskEncryption (root, args, { kmdResponse }) {
    if (kmdResponse.bitlockerStatus) {
      return kmdResponse.bitlockerStatus === 'ON'
    }
    return false
  },

  async screenLock (root, args, { kmdResponse }) {
    // // screen lock creates problems in workspaces
    // if (info.version.includes('amazon')) {
    //   return UNKNOWN
    // }
    const { windowsMaxScreenLockTimeout = 600 } = args
    const { chargingTimeout, batteryTimeout } = kmdResponse

    return (
      chargingTimeout <= windowsMaxScreenLockTimeout &&
      batteryTimeout <= windowsMaxScreenLockTimeout
    )
  },

  async firewall (root, args, { kmdResponse }) {
    return kmdResponse.firewalls.every(fw => fw.status === 'ON')
  },

  async suggestedApplications (root, args, context) {
    const applications = await Device.applications(root, args, context)
    const { version: osVersion } = context.kmdResponse.system
    const { suggestedApplications = [] } = args

    return suggestedApplications.filter((app) => {
      const { platform = false } = app
      // if a platform is required
      if (platform) {
        if (platform[context.platform]) {
          return semver.satisfies(osVersion, platform[context.platform])
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
        userApp = applications.find((app) => (new RegExp(name, 'ig')).test(app.name))
      } else {
        userApp = applications.find((app) => app.name === name)
      }

      // app isn't installed - fail
      if (!userApp) return { name, passing: NUDGE, reason: 'NOT_INSTALLED' }
      // app is out of date - fail
      if (version && !semver.satisfies(userApp.version, version)) {
        return { name, passing: NUDGE, reason: 'OUT_OF_DATE' }
      }

      return { name, passing: true }
    })
  },

  async requiredApplications (root, args, context) {
    const applications = await Device.applications(root, args, context)
    const { version: osVersion } = context.kmdResponse.system
    const { requiredApplications = [] } = args

    return requiredApplications.filter((app) => {
      const { platform = false } = app
      // if a platform is required
      if (platform) {
        if (platform[context.platform]) {
          return semver.satisfies(osVersion, platform[context.platform])
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
        userApp = applications.find((app) => (new RegExp(name, 'ig')).test(app.name))
      } else {
        userApp = applications.find((app) => app.name === name)
      }

      // app isn't installed - fail
      if (!userApp) return { name, passing: false, reason: 'NOT_INSTALLED' }
      // app is out of date - fail
      if (version && !semver.satisfies(userApp.version, version)) {
        return { name, passing: false, reason: 'OUT_OF_DATE' }
      }

      return { name, passing: true }
    })
  },

  async bannedApplications (root, args, context) {
    const applications = await Device.applications(root, args, context)
    const { version: osVersion } = await context.osVersion
    const { bannedApplications = [] } = args

    return bannedApplications.filter((app) => {
      const { platform = false } = app
      // if a platform is required
      if (platform) {
        if (platform[context.platform]) {
          return semver.satisfies(osVersion, platform[context.platform])
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
        userApp = applications.find((app) => (new RegExp(name, 'ig')).test(app.name))
      } else {
        userApp = applications.find((app) => app.name === name)
      }

      if (userApp) return { name, passing: false, reason: 'INSTALLED' }

      return { name, passing: true }
    })
  }
}

module.exports = WindowsSecurity
