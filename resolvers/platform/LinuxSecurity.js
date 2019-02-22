const { UNKNOWN } = require('../../src/constants')

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
  }
}
