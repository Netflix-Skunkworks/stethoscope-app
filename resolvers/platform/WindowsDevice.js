const OSQuery = require('../../sources/osquery_thrift')
const powershell = require('../../src/lib/powershell')

const WindowsDevice = {
  async friendlyName (root, args, context) {
    const { hardware_model: hardwareModel } = await context.systemInfo
    return hardwareModel
  },

  async disks (root, args, context) {
    const descriptors = await OSQuery.all('logical_drives', {
      fields: ['device_id as label']
    })
    return powershell.disks(descriptors)
  },

  async applications (root, args, context) {
    const programs = await OSQuery.all('programs', {
      fields: ['name', 'version', 'install_date as installDate']
    })
    return programs
  }
}

module.exports = WindowsDevice
