const { UNKNOWN } = require('../../src/constants')
const semver = require('semver')

module.exports = {
  async firewall (root, args, { kmdResponse }) {
    return kmdResponse.firewallEnabled === "1"
  },

  async diskEncryption (root, args, { kmdResponse }) {
    return kmdResponse.disks.encryption === "true"
  },

  async remoteLogin (root, args, { kmdResponse }) {
    return !!kmdResponse.remoteLogin
  },

  async automaticUpdates (root, args, { kmdResponse }) {
    if (kmdResponse.updates) {
      return updates.criticalUpdateInstall === "1"
    }
    return UNKNOWN
  },

  async screenLock (root, args, { kmdResponse }) {
    return kmdResponse.screen.lockEnabled === 'true'
  },

  async screenIdle (root, args, { kmdResponse }) {
    const idleDelay = kmdResponse.screen.lockDelay
    return kmdResponse.screen.idleActivationEnabled === 'true' &&
     semver.satisfies(semver.coerce(idleDelay), args.screenIdle)
  }
}
