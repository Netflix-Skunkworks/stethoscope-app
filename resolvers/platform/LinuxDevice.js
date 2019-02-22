module.exports = {
  async disks (root, args, { kmdResponse }) {
    return kmdResponse.disks.volumes
  },
}
