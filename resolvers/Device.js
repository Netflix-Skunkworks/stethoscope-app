const pkg = require('../package.json')
const OSQuery = require('../sources/osquery')
const NetworkInterface = require('../src/lib/NetworkInterface')
const macFriendlyName = require('../sources/macmodels')
const Security = require('./Security')
const { ON, OFF, UNKNOWN, NUDGE } = require('../src/constants')

const securityToDeviceStatus = status => {
  if (typeof status === 'boolean') {
    return status ? ON : OFF
  }

  if (status === NUDGE) {
    return OFF
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
    const { vendor } = await context.platformInfo
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
    const { hardware_model: hardwareModel } = await context.systemInfo

    switch (context.platform) {
      case 'darwin':
        return macFriendlyName(hardwareModel)
    }
    return hardwareModel
  },

  async hardwareModel (root, args, context) {
    const { hardware_model: hardwareModel } = await context.systemInfo
    return hardwareModel
  },

  async hardwareSerial (root, args, context) {
    const { hardware_serial: hardwareSerial } = await context.systemInfo
    return hardwareSerial
  },

  async applications (root, args, context) {
    switch (context.platform) {
      case 'darwin':
        const apps = await OSQuery.all('apps', {
          fields: ['name', 'display_name as displayName', 'bundle_version as version', 'last_opened_time as lastOpenedTime']
        })
        return apps
      case 'win32':
        const programs = await OSQuery.all('programs', {
          fields: ['name', 'version', 'install_date as installDate']
        })
        return programs
      default:
        return []
    }
  },

  policyResult (root, args, context) {
    return 'UNKNOWN'
  },

  // can/should these be filtered down?
  ipAddresses (root, args, context) {
    return OSQuery.all('interface_addresses')
  },

  // can/should these be filtered down?
  async macAddresses (root, args, context) {
    const addresses = await OSQuery.all('interface_details', {
      fields: ['interface', 'type', 'mac', 'physical_adapter as physicalAdapter', 'last_change as lastChange']
    })

    const { isLocal, isMulticast, isPlaceholder } = NetworkInterface

    return addresses.filter(({ mac }) => !isLocal(mac) && !isMulticast(mac) && !isPlaceholder(mac))
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

      async automaticConfigDataInstall (root, args, context) {
        const status = await Security.automaticConfigDataInstall(root, args, context)
        return securityToDeviceStatus(status)
      },

      async automaticDownloadUpdates (root, args, context) {
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

      async remoteLogin (root, args, context) {
        const status = await Security.remoteLogin(root, args, context)
        return securityToDeviceStatus(status)
      }
    }
  },

  async disks (root, args, context) {
    const userPartitions = await OSQuery.all('mounts m join disk_encryption de ON m.device_alias = de.name join block_devices bd ON bd.name = de.name', {
      where: "m.path = '/'",
      // where: 'bd.type != "Virtual Interface"', // this will exclude DMGs
      fields: ['label', 'de.name as name', 'de.uuid as uuid', 'encrypted']
    })
    return userPartitions
  }
}

module.exports = Device
