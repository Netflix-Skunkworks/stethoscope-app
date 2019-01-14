const macFriendlyName = require('../../sources/macmodels')

const MacDevice = {
  friendlyName (root, args, { kmdResponse }) {
    const hardwareModel = kmdResponse.system.hardwareVersion
    return macFriendlyName(hardwareModel)
  },

  disks (root, args, { kmdResponse }) {
    return kmdResponse.disks.volumes.map(disk => {
      return {
        name: disk.label,
        label: disk.label,
        uuid: '',
        encrypted: kmdResponse.disks.enabled === '1'
      }
    })
  },

  applications (root, args, { kmdResponse }) {
    return kmdResponse.apps
  }
}

module.exports = MacDevice
