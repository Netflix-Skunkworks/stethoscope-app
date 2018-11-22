const pkg = require('../package.json')
const OSQuery = require('../sources/osquery')
const NetworkInterface = require('../src/lib/NetworkInterface')
const Security = require('./Security')
const { ON, OFF, UNKNOWN, UNSUPPORTED, NUDGE, PASS, FAIL } = require('../src/constants')
const { Device: PlatformResolvers } = require('./platform')

const securityToDeviceStatus = status => {
  if (typeof status === 'boolean') {
    return status ? ON : OFF
  }

  if (status === NUDGE) {
    return OFF
  }

  return UNKNOWN
}

const securityToPassFailStatus = status => {
  if (typeof status === 'boolean') {
    return status ? PASS : FAIL
  }

  return UNKNOWN
}

const Device = {
  async deviceId (root, args, context) {
    const { uuid } = await context.systemInfo
    return uuid
  },

  async deviceName (root, args, context) {
    const { computer_name: computerName } = await context.systemInfo
    return computerName
  },

  async platform (root, args, context) {
    const { platform } = await context.osVersion
    return platform
  },

  async platformName (root, args, context) {
    const { vendor = '' } = await context.platformInfo
    return vendor.trim()
  },

  async osVersion (root, args, context) {
    const { version } = await context.osVersion
    return version
  },

  async osBuild (root, args, context) {
    const { build } = await context.osVersion
    return build
  },

  async osName (root, args, context) {
    const { name } = await context.osVersion
    return name
  },

  async firmwareVersion (root, args, context) {
    const { revision } = await context.platformInfo
    return revision
  },

  async friendlyName (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if ('friendlyName' in os) {
      return os.friendlyName(root, args, context)
    }

    return UNSUPPORTED
  },

  async hardwareModel (root, args, context) {
    const { hardware_model: hardwareModel } = await context.systemInfo
    return hardwareModel
  },

  async hardwareSerial (root, args, context) {
    const { hardware_serial: hardwareSerial } = await context.systemInfo
    return hardwareSerial
  },

  async extensions (root, args, context) {
    const { browser = "all" } = args
    let chrome = []
    let firefox = []
    let safari = []

    if (['all', 'chrome'].includes(browser)) {
      chrome = await OSQuery.all('chrome_extensions').then(results =>
        results.map(({ name, version, identifier, path, author }) =>
          ({ name, path, version, identifier, author, browser: 'chrome' })
        )
      )
    }

    if (['all', 'firefox'].includes(browser)) {
      firefox = await OSQuery.all('firefox_addons').then(results =>
        results.map(({ name, version, identifier, path, creator: author }) =>
          ({ name, path, version, identifier, author, browser: 'firefox' })
        )
      )
    }

    if (['all', 'safari'].includes(browser)) {
      safari = await OSQuery.all('safari_extensions').then(results =>
        results.map(({ name, version, identifier, path, creator: author }) =>
          ({ name, path, version, identifier, author, browser: 'safari' })
        )
      )
    }

    return chrome.concat(firefox).concat(safari)
  },

  async hotfixes (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if ('hotfixes' in os) {
      return os.hotfixes(root, args, context)
    }

    return []
  },

  async applications (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if ('applications' in os) {
      return os.applications(root, args, context)
    }

    return UNSUPPORTED
  },

  policyResult (root, args, context) {
    return UNKNOWN
  },

  // can/should these be filtered down?
  ipAddresses (root, args, context) {
    return OSQuery.all('interface_addresses')
  },

  // can/should these be filtered down?
  async macAddresses (root, args, context) {
    return context.macAddresses
  },

  async osqueryVersion (root, args, context) {
    const info = await OSQuery.first('osquery_info')
    return info.version
  },

  stethoscopeVersion (root, args, context) {
    return pkg.version
  },

  async security (root, args, context) {
    return {
      async firewall () {
        const status = await Security.firewall(root, args, context)
        return securityToDeviceStatus(status)
      },

      async automaticUpdates () {
        const status = await Security.automaticUpdates(root, args, context)
        return securityToDeviceStatus(status)
      },

      async automaticSecurityUpdates () {
        const status = await Security.automaticSecurityUpdates(root, args, context)
        return securityToDeviceStatus(status)
      },

      async automaticOsUpdates () {
        const status = await Security.automaticOsUpdates(root, args, context)
        return securityToDeviceStatus(status)
      },

      async automaticConfigDataInstall () {
        const status = await Security.automaticConfigDataInstall(root, args, context)
        return securityToDeviceStatus(status)
      },

      async automaticDownloadUpdates () {
        const status = await Security.automaticDownloadUpdates(root, args, context)
        return securityToDeviceStatus(status)
      },

      async automaticAppUpdates () {
        const status = await Security.automaticAppUpdates(root, args, context)
        return securityToDeviceStatus(status)
      },

      async diskEncryption () {
        const status = await Security.diskEncryption(root, args, context)
        return securityToDeviceStatus(status)
      },

      async screenLock () {
        const status = await Security.screenLock(root, args, context)
        return securityToDeviceStatus(status)
      },

      async screenIdle () {
        const status = await Security.screenIdle(root, args, context)
        return securityToPassFailStatus(status)
      },

      async remoteLogin () {
        const status = await Security.remoteLogin(root, args, context)
        return securityToDeviceStatus(status)
      },

      async publicFirewall () {
        const status = await Security.publicFirewall(root, args, context)
        return securityToDeviceStatus(status)
      },

      async privateFirewall () {
        const status = await Security.privateFirewall(root, args, context)
        return securityToDeviceStatus(status)
      },

      async domainFirewall () {
        const status = await Security.domainFirewall(root, args, context)
        return securityToDeviceStatus(status)
      }
    }
  },

  async disks (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if ('disks' in os) {
      return os.disks(root, args, context)
    }

    return UNSUPPORTED
  }
}

module.exports = Device
