import kmd from '../../src/lib/kmd'

export default {
  async friendlyName (root, args, context) {
    const result = await kmd('hardwareVersion', context)
    return result.system.hardwareVersion
  },
  async disks (root, args, context) {
    const result = await kmd('disks', context)
    return result.disks.volumes
  }
}
