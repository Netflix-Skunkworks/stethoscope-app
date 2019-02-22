const { UNKNOWN } = require('../../src/constants')

module.exports = {
  async firewall (root, args, { kmdResponse }) {
    return kmdResponse.firewallEnabled === "1"
  },

  async diskEncryption (root, args, { kmdResponse }) {
    return kmdResponse.disks.encryption === "true"
  },

  // TODO update once data source is in place
  async remoteLogin (root, args, context) {
    return UNKNOWN
  },

  async automaticUpdates (root, args, { kmdResponse }) {
    if (kmdResponse.updates) {
      return updates.criticalUpdateInstall === "1"
    }
    return UNKNOWN
  }
}
