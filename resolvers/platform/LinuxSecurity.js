const OSQuery = require('../../sources/osquery')

module.exports = {
  async firewall (root, args, context) {
    /*
      select * form iptables
     */
    const ufwRules = await OSQuery.all('iptables', {
      fields: ['chain'],
      where: 'chain like "%ufw%" and target in ("DROP", "REJECT")'
    })
    return Array.isArray(ufwRules) && ufwRules.length > 0
  },

  async diskEncryption (root, args, context) {
    const disks = await OSQuery.all('disk_encryption', {
      fields: ['encrypted'],
      where: 'name = (select device from mounts where path = "/")'
    })
    return disks.every(({ encrypted }) => encrypted === "1")
  },

  async remoteLogin (root, args, context) {
    const sshEnabled = await OSQuery.all('processes', {
      fields: ['*'],
      where: 'name LIKE "%sshd%"'
    })

    return Array.isArray(sshEnabled) && sshEnabled.length > 0
  }
}
