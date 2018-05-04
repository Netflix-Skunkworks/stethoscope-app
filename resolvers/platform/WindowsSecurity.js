const semver = require('semver')
const Device = require('../Device')
const OSQuery = require('../../sources/osquery')
const powershell = require('../../src/lib/powershell')
const pkg = require('../../package.json')
const { NUDGE, UNKNOWN } = require('../../src/constants')

const WindowsSecurity = {
  /*
    select 1 as automatic_updates from services
    where display_name = "Windows Update" and start_type != "DISABLED"
   */
  async automaticUpdates (root, args, context) {
    const services = await OSQuery.first('services', {
      fields: ['1 as automaticUpdates'],
      where: 'display_name = "Windows Update" and start_type != "DISABLED"'
    })

    return services && services.automaticUpdates === '1'
  },

  /*
    select data from registry
    where path = 'HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Terminal Server\fDenyTSConnections'
   */
  async remoteLogin (root, args, context) {
    const result = await OSQuery.first('registry', {
      fields: ['data'],
      where: `path = 'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\fDenyTSConnections'`
    })
    return result.data !== '1'
  },

  /*
    select 1 as encrypted from services
    where display_name = "BitLocker Drive Encryption Service" and status = "RUNNING"
   */
  async diskEncryption (root, args, context) {
    const bitlockerRunning = await OSQuery.first('services', {
      fields: ['1 as encrypted'],
      where: 'display_name = "BitLocker Drive Encryption Service" and status = "RUNNING"'
    })

    return bitlockerRunning && bitlockerRunning.encrypted === '1'
  },

  /*
    select name, data from registry
    where path = 'HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\AutoAdminLogin'
   */
  async screenLock (root, args, context) {
    const { autoAdminLogin } = await OSQuery.first('registry', {
      fields: ['name', 'data as autoAdminLogin'],
      where: `path = 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\AutoAdminLogin'`
    })
    const screenLockIsActive = await powershell.getScreenLockActive()
    const workstationLockIsDisabled = await powershell.getDisableLockWorkStation()
    return (
      workstationLockIsDisabled === false &&
      screenLockIsActive === true &&
      autoAdminLogin !== '1'
    )
  },

  async publicFirewall (root, args, context) {
    const { publicFirewall } = await powershell.firewallStatus()
    return publicFirewall === 'ON'
  },

  async privateFirewall (root, args, context) {
    const { privateFirewall } = await powershell.firewallStatus()
    return privateFirewall === 'ON'
  },

  async domainFirewall (root, args, context) {
    const { domainFirewall } = await powershell.firewallStatus()
    return domainFirewall === 'ON'
  },

  /*
    select name, data from registry
    where key like 'HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\SharedAccess\Parameters\FirewallPolicy\StandardProfile' and name = 'EnableFirewall'
   */
  // const result = await OSQuery.first('registry', { fields: ['name', 'data'], where: `key like 'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\SharedAccess\\Parameters\\FirewallPolicy\\StandardProfile' and name = 'EnableFirewall'` })
  // return result && result.data === '1'
  async firewall (root, args, context) {
    const publicFirewall = await WindowsSecurity.publicFirewall()
    const privateFirewall = await WindowsSecurity.privateFirewall()
    const domainFirewall = await WindowsSecurity.domainFirewall()

    // all must be ON for the overall Firewall test to pass
    return [
      domainFirewall,
      privateFirewall,
      publicFirewall
    ].every(status => status)
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

module.exports = WindowsSecurity
