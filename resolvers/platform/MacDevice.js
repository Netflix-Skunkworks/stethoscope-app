const OSQuery = require('../../sources/osquery_thrift')
const macFriendlyName = require('../../sources/macmodels')

const MacDevice = {
  async friendlyName (root, args, context) {
    const { hardware_model: hardwareModel } = await context.systemInfo
    return macFriendlyName(hardwareModel)
  },

  async disks (root, args, context) {
    const userPartitions = await OSQuery.all('mounts m join disk_encryption de ON m.device_alias = de.name join block_devices bd ON bd.name = de.name', {
      where: "m.path = '/'",
      // where: 'bd.type != "Virtual Interface"', // this will exclude DMGs
      fields: ['label', 'de.name as name', 'de.uuid as uuid', 'encrypted']
    })
    return userPartitions
  },

  async applications (root, args, context) {
    const apps = await OSQuery.all('apps', {
      fields: ['name', 'display_name as displayName', 'bundle_version as version', 'last_opened_time as lastOpenedTime']
    })
    return apps
  }
}

module.exports = MacDevice
