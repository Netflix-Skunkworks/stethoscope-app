import kmd from '../../lib/kmd'
import linuxFriendlyName from './LinuxDeviceName'

export default {
  async friendlyName (root, args, context) {
    const result = await kmd('hardware', context)
    const hardwareModel = result.system.hardwareVersion
    return linuxFriendlyName(hardwareModel)
  },
  async disks (root, args, context) {
    const result = await kmd('disks', context)
    return result.disks.volumes
  }
}
