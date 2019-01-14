const pkg = require('../package.json')
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
  deviceId (root, args, { kmdResponse }) {
    return kmdResponse.system.uuid
  },

  deviceName (root, args, { kmdResponse }) {
    return kmdResponse.system.hostname
  },

  platform (root, args, context) {
    return context.platform
  },

  platformName (root, args, { kmdResponse }) {
    return kmdResponse.system.platform
  },

  osVersion (root, args, { kmdResponse }) {
    return kmdResponse.system.version
  },

  osBuild (root, args, { kmdResponse }) {
    return kmdResponse.system.build
  },

  osName (root, args, { kmdResponse }) {
    return kmdResponse.system.platform
  },

  firmwareVersion (root, args, { kmdResponse }) {
    return kmdResponse.system.firmwareVersion
  },

  friendlyName (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if ('friendlyName' in os) {
      return os.friendlyName(root, args, context)
    }

    return UNSUPPORTED
  },

  hardwareModel (root, args, { kmdResponse }) {
    return kmdResponse.system.hardwareVersion
  },

  hardwareSerial (root, args, { kmdResponse }) {
    return kmdResponse.system.serialNumber
  },

  extensions (root, args, { kmdResponse }) {
    const { browser = "all" } = args
    let chrome = []
    let firefox = []
    let safari = []

    return kmdResponse.extensions
  },

  applications (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if ('applications' in os) {
      return os.applications(root, args, context)
    }

    return UNSUPPORTED
  },

  policyResult (root, args, context) {
    return UNKNOWN
  },

  // TODO implement??
  // can/should these be filtered down?
  ipAddresses (root, args, context) {
    return []
  },

  // can/should these be filtered down?
  macAddresses (root, args, { kmdResponse }) {
    return kmdResponse.macAddresses.map(({ addr, device }) => ({
      mac: addr,
      interface: device
    }))
  },

  stethoscopeVersion (root, args, context) {
    return pkg.version
  },

  security (root, args, context) {
    return {
      firewall () {
        const status = Security.firewall(root, args, context)
        return securityToDeviceStatus(status)
      },

      automaticUpdates () {
        const status = Security.automaticUpdates(root, args, context)
        return securityToDeviceStatus(status)
      },

      automaticSecurityUpdates () {
        const status = Security.automaticSecurityUpdates(root, args, context)
        return securityToDeviceStatus(status)
      },

      automaticOsUpdates () {
        const status = Security.automaticOsUpdates(root, args, context)
        return securityToDeviceStatus(status)
      },

      automaticConfigDataInstall () {
        const status = Security.automaticConfigDataInstall(root, args, context)
        return securityToDeviceStatus(status)
      },

      automaticDownloadUpdates () {
        const status = Security.automaticDownloadUpdates(root, args, context)
        return securityToDeviceStatus(status)
      },

      automaticAppUpdates () {
        const status = Security.automaticAppUpdates(root, args, context)
        return securityToDeviceStatus(status)
      },

      diskEncryption () {
        const status = Security.diskEncryption(root, args, context)
        return securityToDeviceStatus(status)
      },

      screenLock () {
        const status = Security.screenLock(root, args, context)
        return securityToDeviceStatus(status)
      },

      screenIdle () {
        const status = Security.screenIdle(root, args, context)
        return securityToPassFailStatus(status)
      },

      remoteLogin () {
        const status = Security.remoteLogin(root, args, context)
        return securityToDeviceStatus(status)
      },

      publicFirewall () {
        const status = Security.publicFirewall(root, args, context)
        return securityToDeviceStatus(status)
      },

      privateFirewall () {
        const status = Security.privateFirewall(root, args, context)
        return securityToDeviceStatus(status)
      },

      domainFirewall () {
        const status = Security.domainFirewall(root, args, context)
        return securityToDeviceStatus(status)
      }
    }
  },

  disks (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if ('disks' in os) {
      return os.disks(root, args, context)
    }

    return UNSUPPORTED
  }
}

module.exports = Device
