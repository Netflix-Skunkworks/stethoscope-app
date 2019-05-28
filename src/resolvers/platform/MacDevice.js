import kmd from '../../lib/kmd'
import macFriendlyName from '../../sources/macmodels'

const MacDevice = {
  async friendlyName (root, args, context) {
    const result = await kmd('hardware', context)
    const hardwareModel = result.system.hardwareVersion
    return macFriendlyName(hardwareModel)
  },

  async disks (root, args, context) {
    const fileVault = await kmd('file-vault', context)
    const result = await kmd('disks', context)
    const encrypted = fileVault.fileVaultEnabled === 'true'
    return result.disks.map((disk, i) => {
      const res = {
        encrypted: disk.encrypted,
        label: disk.label,
        name: disk.label,
        uuid: disk.uuid
      }

      if (i === 0) {
        res.encrypted = encrypted
      }

      return res
    })
  },

  async applications (root, args, context) {
    // const result = await kmd('apps', context)
    return []
  }
}

export default MacDevice
