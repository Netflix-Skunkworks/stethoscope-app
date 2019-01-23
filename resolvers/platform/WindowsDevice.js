const WindowsDevice = {
  async friendlyName (root, args, { kmdResponse }) {
    return kmdResponse.system.hardwareVersion
  },

  async disks (root, args, context) {
    return []
  },

  async applications (root, args, { kmdResponse }) {
    return []
  }
}

module.exports = WindowsDevice
