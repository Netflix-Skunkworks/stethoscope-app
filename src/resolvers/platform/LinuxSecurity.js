import { UNKNOWN } from '../../constants'
import semver from 'semver'
import kmd from '../../lib/kmd'

export default {
  async firewall (root, args, context) {
    const result = await kmd('firewall', context)
    return result.firewallEnabled === '1'
  },

  async diskEncryption (root, args, context) {
    const result = await kmd('disks', context)
    return result.disks.encryption === 'true'
  },

  async remoteLogin (root, args, context) {
    const result = await kmd('remote-login', context)
    return !!result.remoteLogin
  },

  async automaticUpdates (root, args, context) {
    const device = await kmd('os', context)

    if (device.system.platform.toLowerCase().trim() === 'ubuntu') {
      const settings = await kmd('ubuntu/critical-updates', context)
      if (settings.updates) {
        return settings.updates.criticalUpdateInstall === '1'
      }
    }

    return UNKNOWN
  },

  async screenLock (root, args, context) {
    const settings = await kmd('screen', context)
    return settings.screen.lockEnabled === 'true'
  },

  async screenIdle (root, args, context) {
    const settings = await kmd('screen', context)
    const { screenIdle } = args
    const { lockDelay, idleActivationEnabled } = settings.screen
    const delayOk = semver.satisfies(semver.coerce(lockDelay), screenIdle)
    const idleOk = idleActivationEnabled === 'true'
    return delayOk && idleOk
  }
}
