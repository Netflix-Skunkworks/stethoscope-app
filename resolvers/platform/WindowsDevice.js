const WindowsDevice = {
  async friendlyName (root, args, { kmdResponse }) {
    return kmdResponse.system.hardwareVersion
  },

  async disks (root, args, context) {
    return null
  },

  async applications (root, args, { kmdResponse }) {
    return null
  }
}

module.exports = WindowsDevice
