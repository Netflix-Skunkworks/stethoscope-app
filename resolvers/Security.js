const semver = require('semver')
const Device = require('./Device')
const OSQuery = require('../sources/osquery')
const pkg = require('../package.json')
const { NUDGE, IF_SUPPORTED } = require('../src/constants')

const Security = {
  async automaticAppUpdates (root, args, context) {
    switch (context.platform) {
      case 'darwin':
        const {automaticAppUpdates} = await OSQuery.first('plist', {
          fields: ['value as automaticAppUpdates'],
          where: `path = '/Library/Preferences/com.apple.commerce.plist' AND key = 'AutoUpdate'`
        })

        return automaticAppUpdates !== '0'
      default:
        break
    }

    return true
  },

  async automaticDownloadUpdates (root, args, context) {
    switch (context.platform) {
      case 'darwin':
        const {automaticDownloadUpdates} = await OSQuery.first('plist', {
          fields: ['value as automaticDownloadUpdates'],
          where: `path = '/Library/Preferences/com.apple.SoftwareUpdate.plist' AND key = 'AutomaticDownload'`
        })

        return automaticDownloadUpdates !== '0'
      default:
        break
    }

    return true
  },

  async automaticConfigDataInstall (root, args, context) {
    switch (context.platform) {
      case 'darwin':
        const {automaticConfigDataInstall} = await OSQuery.first('plist', {
          fields: ['value as automaticConfigDataInstall'],
          where: `path = '/Library/Preferences/com.apple.SoftwareUpdate.plist' AND key = 'ConfigDataInstall'`
        })

        return automaticConfigDataInstall !== '0'
      default:
        break
    }

    return true
  },

  async automaticSecurityUpdates (root, args, context) {
    switch (context.platform) {
      case 'darwin':
        const {automaticSecurityUpdates} = await OSQuery.first('plist', {
          fields: ['value as automaticSecurityUpdates'],
          where: `path = '/Library/Preferences/com.apple.SoftwareUpdate.plist' AND key = 'CriticalUpdateInstall'`
        })

        return automaticSecurityUpdates !== '0' || NUDGE
      default:
        break
    }

    return true
  },

  async automaticOsUpdates (root, args, context) {
    switch (context.platform) {
      case 'darwin':
        const {osUpdates} = await OSQuery.first('plist', {
          fields: ['value as osUpdates'],
          where: `path = '/Library/Preferences/com.apple.commerce.plist' AND key = 'AutoUpdateRestartRequired'`
        })

        return osUpdates !== '0' || NUDGE
      default:
        break
    }

    return true
  },

  async automaticUpdates (root, args, context) {
    switch (context.platform) {
      case 'darwin':
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

        const appUpdates = await Security.automaticAppUpdates(root, args, context)
        const osUpdates = await Security.automaticOsUpdates(root, args, context)
        const securityUpdates = await Security.automaticSecurityUpdates(root, args, context)
        const automaticDownloadUpdates = await Security.automaticDownloadUpdates(root, args, context)
        const automaticConfigDataInstall = await Security.automaticConfigDataInstall(root, args, context)

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

      case 'win32':
        /*
          select 1 as automatic_updates from services
          where display_name = "Windows Update" and start_type != "DISABLED"
         */
        const services = await OSQuery.first('services', {
          fields: ['1 as automaticUpdates'],
          where: 'display_name = "Windows Update" and start_type != "DISABLED"'
        })

        return services && services.automaticUpdates === '1'

      case 'linux':
      default:
        return false
    }
  },

  async remoteLogin (root, args, context) {
    switch (context.platform) {
      case 'darwin':
        /*
          select * from sharing_preferences
         */
        const result = await OSQuery.first('sharing_preferences')
        return result.remote_login === '1'

      case 'win32':
        /*
          select data from registry
          where path = 'HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Terminal Server\fDenyTSConnections'
         */
        const winResult = await OSQuery.first('registry', {
          fields: ['data'],
          where: `path = 'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\fDenyTSConnections'`
        })
        return winResult.data !== '1'
    }

    return false
  },

  async diskEncryption (root, args, context) {
    switch (context.platform) {
      case 'darwin':

        // adapted from https://github.com/kolide/launcher/blob/master/osquery/best_practices.go
        // SELECT device, path, bd.type, label, encrypted  FROM mounts m join disk_encryption de ON m.device_alias = de.name join block_devices bd ON bd.name = de.name WHERE bd.type != "Virtual Interface";

        // TODO Change this to check other volumes?
        // Some macOS versions have other drives that show up, like the recovery partition, so we'll like need an allowed list.
        /*
          select encrypted, path from mounts m
          join disk_encryption de ON m.device_alias = de.name
          join block_devices bd ON bd.name = de.name
          where m.path = '/'
         */
        const userPartitions = await OSQuery.all('mounts m join disk_encryption de ON m.device_alias = de.name join block_devices bd ON bd.name = de.name', {
          where: "m.path = '/'",
          // where: 'bd.type != "Virtual Interface"', // this will exclude DMGs
          fields: ['encrypted', 'path']
        })

        // because array.every will return true on an empty set
        if (userPartitions.length === 0) {
          userPartitions.push({ encrypted: false })
        }

        return userPartitions.every(({ encrypted }) => encrypted === '1')

      case 'win32':
        /*
          select 1 as encrypted from services
          where display_name = "BitLocker Drive Encryption Service" and status = "RUNNING"
         */
        const bitlockerRunning = await OSQuery.first('services', {
          fields: ['1 as encrypted'],
          where: 'display_name = "BitLocker Drive Encryption Service" and status = "RUNNING"'
        })

        return bitlockerRunning && bitlockerRunning.encrypted === '1'
      default:
        return false
    }
  },

  async stethoscopeVersion (root, args, context) {
    return semver.satisfies(pkg.version, args.stethoscopeVersion)
  },

  async screenLock (root, args, context) {
    let { version } = await context.osVersion

    switch (context.platform) {
      case 'darwin':
        if (semver.satisfies(version, '<10.13')) {
          /*
            select value as screen_lock from preferences
            where domain = 'com.apple.screensaver' and key = 'askForPassword'
          */
          const { screenLock } = await OSQuery.first('preferences', {
            fields: ['value as screenLock'],
            where: `domain = 'com.apple.screensaver' and key = 'askForPassword'`
          })

          return screenLock === '1'
        } else {
          // macOS High Sierra removed support screen lock querying
          return args.screenLock === IF_SUPPORTED
        }

      case 'win32':
        /*
          select name, data from registry
          where path = 'HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\AutoAdminLogin'
         */
        const response = await OSQuery.first('registry', {
          fields: ['name', 'data'],
          where: `path = 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\AutoAdminLogin'`
        })
        return response.data !== '1'

      default:
        return false
    }
  },

  async osVersion (root, args, context) {
    const { ok, nudge } = args.osVersion[context.platform]
    let { version } = await context.osVersion

    if (semver.satisfies(semver.coerce(version), ok)) {
      return true
    } else if (semver.satisfies(semver.coerce(version), nudge)) {
      return NUDGE
    } else {
      return false
    }
  },

  async firewall (root, args, context) {
    switch (context.platform) {
      case 'darwin':
        /*
          select global_state as firewall_enabled from alf
         */
        const { firewallEnabled = 0 } = await OSQuery.first('alf', { fields: ['global_state as firewallEnabled'] })
        return parseInt(firewallEnabled, 10) > 0

      case 'win32':
        /*
          select name, data from registry
          where key like 'HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\SharedAccess\Parameters\FirewallPolicy\StandardProfile' and name = 'EnableFirewall'
         */
        const result = await OSQuery.first('registry', { fields: ['name', 'data'], where: `key like 'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\SharedAccess\\Parameters\\FirewallPolicy\\StandardProfile' and name = 'EnableFirewall'` })
        return result && result.data === '1'

      case 'linux':
        // TODO
        return true
    }
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

module.exports = Security
