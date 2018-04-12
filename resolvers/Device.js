const pkg = require('../package.json')
const OSQuery = require('../sources/osquery')
const NetworkInterface = require('../src/lib/NetworkInterface')
const macFriendlyName = require('../sources/macmodels')

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
    return true
  },

  disks (root, args, context) {
    return OSQuery.all('block_devices')
  }
}

module.exports = Device
