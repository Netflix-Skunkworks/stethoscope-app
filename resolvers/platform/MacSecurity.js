const semver = require('semver')
const Device = require('./MacDevice')
const OSQuery = require('../../sources/osquery')
const pkg = require('../../package.json')
const { exec } = require('child_process')
const { NUDGE, UNKNOWN } = require('../../src/constants')

const MacSecurity = {
  async automaticAppUpdates (root, args, context) {
    const {automaticAppUpdates} = await OSQuery.first('plist', {
      fields: ['value as automaticAppUpdates'],
      where: `path = '/Library/Preferences/com.apple.commerce.plist' AND key = 'AutoUpdate'`
    })

    return automaticAppUpdates !== '0'
  },

  async automaticDownloadUpdates (root, args, context) {
    const {automaticDownloadUpdates} = await OSQuery.first('plist', {
      fields: ['value as automaticDownloadUpdates'],
      where: `path = '/Library/Preferences/com.apple.SoftwareUpdate.plist' AND key = 'AutomaticDownload'`
    })

    return automaticDownloadUpdates !== '0'
  },

  async automaticConfigDataInstall (root, args, context) {
    const {automaticConfigDataInstall} = await OSQuery.first('plist', {
      fields: ['value as automaticConfigDataInstall'],
      where: `path = '/Library/Preferences/com.apple.SoftwareUpdate.plist' AND key = 'ConfigDataInstall'`
    })

    return automaticConfigDataInstall !== '0'
  },

  async automaticSecurityUpdates (root, args, context) {
    const {automaticSecurityUpdates} = await OSQuery.first('plist', {
      fields: ['value as automaticSecurityUpdates'],
      where: `path = '/Library/Preferences/com.apple.SoftwareUpdate.plist' AND key = 'CriticalUpdateInstall'`
    })

    return automaticSecurityUpdates !== '0' || NUDGE
  },

  async automaticOsUpdates (root, args, context) {
    const {osUpdates} = await OSQuery.first('plist', {
      fields: ['value as osUpdates'],
      where: `path = '/Library/Preferences/com.apple.commerce.plist' AND key = 'AutoUpdateRestartRequired'`
    })

    return osUpdates !== '0' || NUDGE
  },

  async automaticUpdates (root, args, context) {
    /*
      select key, value from plist
      where path = '/Library/Preferences/com.apple.SoftwareUpdate.plist' and key = 'AutomaticCheckEnabled'
     */
    const {automaticUpdates} = await OSQuery.first('plist', {
      fields: ['value as automaticUpdates'],
      where: `path = '/Library/Preferences/com.apple.SoftwareUpdate.plist' AND key = 'AutomaticCheckEnabled'`
    })

    if (automaticUpdates === '0') {
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

  async remoteLogin (root, args, context) {
    /* select * from sharing_preferences */
    const result = await OSQuery.first('sharing_preferences')
    return result.remote_login === '1'
  },

  /*
    current check is running fdesetup isactive to determine if FileVault is on
    OLD check:
    -- adapted from https://github.com/kolide/launcher/blob/master/osquery/best_practices.go
    select encrypted, path from mounts m
    join disk_encryption de ON m.device_alias = de.name
    join block_devices bd ON bd.name = de.name
    where m.path = '/'
  */
  diskEncryption (root, args, context) {
    return new Promise((resolve, reject) => {
      exec('fdesetup isactive', (error, stdout, stderr) => {
        if (error) {
          return resolve(false);
        }
        resolve(stdout.trim() === 'true')
      });
    })
  },

  async screenLock (root, args, context) {
    let { version } = await context.osVersion
    if (semver.satisfies(version, '<10.13')) {
      /*
        select value as screenLock from preferences
        where domain = 'com.apple.screensaver' and key = 'askForPassword'
      */
      const { screenLock } = await OSQuery.first('preferences', {
        fields: ['value as screenLock'],
        where: `domain = 'com.apple.screensaver' and key = 'askForPassword'`
      })

      return screenLock === '1'
    } else {
      // macOS High Sierra removed support screen lock querying
      return UNKNOWN
    }
  },

  async screenIdle (root, args, context) {
    /*
      select value as screenIdle from preferences
      where domain = 'com.apple.screensaver' and key = 'idleTime'
    */
    const { screenIdle } = await OSQuery.first('preferences', {
      fields: ['value as screenIdle'],
      where: `domain = 'com.apple.screensaver' and key = 'idleTime'`
    })

    return semver.satisfies(semver.coerce(screenIdle), args.screenIdle)
  },

  async firewall (root, args, context) {
    /*
      select global_state as firewall_enabled from alf
     */
    const { firewallEnabled = 0 } = await OSQuery.first('alf', { fields: ['global_state as firewallEnabled'] })
    return parseInt(firewallEnabled, 10) > 0
  },

  async suggestedApplications (root, args, context) {
    const applications = await Device.applications(root, args, context)
    const { version: osVersion } = await context.osVersion
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
    const { version: osVersion } = await context.osVersion
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

module.exports = MacSecurity
