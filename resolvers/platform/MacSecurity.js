const semver = require('../../src/lib/patchedSemver')
const Device = require('./MacDevice')
const pkg = require('../../package.json')
const { exec } = require('child_process')
const { NUDGE, UNKNOWN } = require('../../src/constants')

const MacSecurity = {
  async automaticAppUpdates (root, args, { kmdResponse }) {
    return kmdResponse.updates.autoUpdate !== '0'
  },

  async automaticDownloadUpdates (root, args, { kmdResponse }) {
    return kmdResponse.updates.automaticDownload !== '0'
  },

  async automaticConfigDataInstall (root, args, { kmdResponse }) {
    return kmdResponse.updates.configDataInstall !== '0'
  },

  async automaticSecurityUpdates (root, args, { kmdResponse }) {
    return kmdResponse.updates.criticalUpdateInstall !== '0'
  },

  async automaticOsUpdates (root, args, { kmdResponse }) {
    return kmdResponse.updates.restartRequired !== '0'
  },

  async automaticUpdates (root, args, context) {
    const { kmdResponse } = context
    if (kmdResponse.updates.automaticCheckEnabled === '0') {
      return false
    }

    const appUpdates = await MacSecurity.automaticAppUpdates(root, args, context)
    const osUpdates = await MacSecurity.automaticOsUpdates(root, args, context)
    const securityUpdates = await MacSecurity.automaticSecurityUpdates(root, args, context)
    const automaticDownloadUpdates = await MacSecurity.automaticDownloadUpdates(root, args, context)
    const automaticConfigDataInstall = await MacSecurity.automaticConfigDataInstall(root, args, context)

    const missingSuggested = [
      appUpdates,
      osUpdates,
      securityUpdates,
      automaticDownloadUpdates,
      automaticConfigDataInstall
    ].some(setting => setting === NUDGE)

    if (missingSuggested) {
      return NUDGE
    }

    return true
  },

  async remoteLogin (root, args, { kmdResponse }) {
    const { remoteLogin = false } = kmdResponse
    return !!remoteLogin
  },

  diskEncryption (root, args, { kmdResponse }) {
    return kmdResponse.disks.fileVaultEnabled === 'true'
  },

  async screenLock (root, args, { kmdResponse }) {
    // TODO when branching logic works in kmd
    return true
  },

  async screenIdle (root, args, context) {
    // TODO implement
    return true
  },

  async firewall (root, args, { kmdResponse }) {
    return parseInt(kmdResponse.firewallEnabled, 10) > 0
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
    const { version: osVersion } = context.kmdResponse.system
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

module.exports = MacSecurity
