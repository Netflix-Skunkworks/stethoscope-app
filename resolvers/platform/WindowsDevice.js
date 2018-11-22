const OSQuery = require('../../sources/osquery')
const powershell = require('../../src/lib/powershell')

const WindowsDevice = {
  async friendlyName (root, args, context) {
    const { hardware_model: hardwareModel } = await context.systemInfo
    return hardwareModel
  },

  async disks (root, args, context) {
    const descriptors = await OSQuery.all('bitlocker_info')

    return descriptors.map(disk => ({
      label: disk.drive_letter,
      name: disk.drive_letter,
      uuid: disk.persistent_volume_id,
      encrypted: disk.protection_status === '1' && disk.conversion_status === '1'
    }))
  },

  async hotfixes (root, args, context) {
    let patches = await OSQuery.all('patches')
    if (!patches) patches = []

    console.log(patches)

    return patches.map(({ hotifx_id, installed_on, caption }) =>
      ({ hotfix_id, installed_on, caption, status: !!installed_on })
    )
  },

  async applications (root, args, context) {
    const programs = await OSQuery.all('programs', {
      fields: ['name', 'version', 'install_date as installDate']
    })
    return programs
  }
}

module.exports = WindowsDevice
