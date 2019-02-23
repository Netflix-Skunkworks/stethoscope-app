module.exports = {
  async friendlyName (root, args, { kmdResponse }) {
    return kmdResponse.system.hardwareVersion
  },
  async disks (root, args, { kmdResponse }) {
    return kmdResponse.disks.volumes
  },
}
