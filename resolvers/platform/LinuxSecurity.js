const OSQuery = require('../../sources/osquery_thrift')

module.exports = {
  async firewall (root, args, context) {
    /*
      select * form iptables
     */
    const rules = await OSQuery.all('iptables')
    return Array.isArray(rules) && rules.length > 0
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
