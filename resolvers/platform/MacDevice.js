const macFriendlyName = require('../../sources/macmodels')

const MacDevice = {
  friendlyName (root, args, { kmdResponse }) {
    const hardwareModel = kmdResponse.system.hardwareVersion
    return macFriendlyName(hardwareModel)
  },

  disks (root, args, { kmdResponse }) {
    const encrypted = kmdResponse.disks.fileVaultEnabled === 'true'
    return kmdResponse.disks.volumes.map(disk => {
      return {
        name: disk.label,
        label: disk.label,
        uuid: disk.uuid,
        encrypted,
      }
    })
  },

  applications (root, args, { kmdResponse }) {
    return []
  }
}

module.exports = MacDevice
