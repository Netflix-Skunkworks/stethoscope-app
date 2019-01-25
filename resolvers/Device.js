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
    return kmdResponse.macAddresses.filter(mac => mac.addr)
      .map((mac) => ({
        mac: mac.addr,
        interface: mac.device,
        type: 6,
        physicalAdapter: true,
        lastChange: null
      }))
      .filter(({ mac }) => !NetworkInterface.isLocal(mac))
      .filter(({ mac }) => !NetworkInterface.isMulticast(mac))
      .filter(({ mac }) => !NetworkInterface.isPlaceholder(mac))
  },

  osqueryVersion (root, args, context) {
    return null
  },

  stethoscopeVersion (root, args, context) {
    return pkg.version
  },

  security (root, args, context) {
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

  disks (root, args, context) {
    const os = PlatformResolvers[context.platform]
    if ('disks' in os) {
      return os.disks(root, args, context)
    }

    return UNSUPPORTED
  }
}

module.exports = Device
