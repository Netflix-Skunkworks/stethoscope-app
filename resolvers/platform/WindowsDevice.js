import kmd from '../../src/lib/kmd'

export default {
  async friendlyName (root, args, context) {
    const result = await kmd('hardware', context)
    return result.system.hardwareVersion
  },

  async disks (root, args, context) {
    return null
  },

  async applications (root, args, context) {
    return null
  }
}
