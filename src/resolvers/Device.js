import pkg from '../../package.json'
import NetworkInterface from '../lib/NetworkInterface'
import Security from './Security'
import kmd from '../lib/kmd'
import { ON, OFF, UNKNOWN, UNSUPPORTED, NUDGE, PASS, FAIL } from '../constants'
import { PlatformDevice } from './platform/'

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
    const result = await kmd('hardware', context)
    return result.system.uuid
  },

  async deviceName (root, args, context) {
    const result = await kmd('hostname', context)
    return result.system.hostname
  },

  platform (root, args, context = {}) {
    const { platform = process.platform } = context
    return platform
  },

  async platformName (root, args, context) {
    const result = await kmd('os', context)
    return result.system.platform
  },

  async osVersion (root, args, context) {
    const result = await kmd('os', context)
    const version = result.system.version
    const [major, minor, patch = 0] = String(version).split('.')
    return `${major}.${minor}.${patch}`
  },

  osqueryVersion (root, args, context) {
    return UNSUPPORTED
  },

  async osBuild (root, args, context) {
    const result = await kmd('os', context)
    return result.system.build
  },

  async osName (root, args, context) {
    const result = await kmd('os', context)
    return result.system.platform
  },

  async firmwareVersion (root, args, context) {
    const result = await kmd('hardware', context)
    return result.system.firmwareVersion
  },

  friendlyName (root, args, context) {
    if ('friendlyName' in Device) {
      return PlatformDevice.friendlyName(root, args, context)
    }

    return UNSUPPORTED
  },

  async hardwareModel (root, args, context) {
    const result = await kmd('hardware', context)
    return result.system.hardwareVersion
  },

  async hardwareSerial (root, args, context) {
    const result = await kmd('hardware', context)
    return result.system.serialNumber
  },

  // await kmd('chrome-extensions', context)
  extensions (root, args, context) {
    // const { browser = 'all' } = args
    // let chrome = []
    // let firefox = []
    // let safari = []

    return []
  },

  applications (root, args, context) {
    if ('applications' in Device) {
      return PlatformDevice.applications(root, args, context)
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

  async macAddresses (root, args, context) {
    const result = await kmd('mac-addresses', context)
    return result.macAddresses.filter(mac => mac.addr)
      .map((mac) => ({
        interface: mac.device,
        lastChange: null,
        mac: mac.addr,
        physicalAdapter: true,
        type: 6
      }))
      .filter(({ mac }) => !NetworkInterface.isLocal(mac))
      .filter(({ mac }) => !NetworkInterface.isMulticast(mac))
      .filter(({ mac }) => !NetworkInterface.isPlaceholder(mac))
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

      async automaticCheckEnabled () {
        const status = await Security.automaticCheckEnabled(root, args, context)
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
    if ('disks' in Device) {
      return PlatformDevice.disks(root, args, context)
    }

    return UNSUPPORTED
  }
}

export default Device
