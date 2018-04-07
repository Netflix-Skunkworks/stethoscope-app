const Security = require('./Security')
const { ON, OFF, UNSUPPORTED } = require('../src/constants')

const securityToDeviceStatus = status => {
  if (typeof status === 'boolean') {
    return status ? ON : OFF
  }
  return UNSUPPORTED
}

module.exports = {
  // TODO expose this for osqueryd server?
  async firewall (root, args, context) {
    const status = await Security.firewall(root, args, context)
    return securityToDeviceStatus(status)
  },

  async automaticUpdates (root, args, context) {
    const status = await Security.automaticUpdates(root, args, context)
    return securityToDeviceStatus(status)
  },

  async diskEncryption (root, args, context) {
    const status = await Security.diskEncryption(root, args, context)
    return securityToDeviceStatus(status)
  },

  async screenLock (root, args, context) {
    const status = await Security.screenLock(root, args, context)
    return securityToDeviceStatus(status)
  },

  async remoteLogin (root, args, context) {
    const status = await Security.remoteLogin(root, args, context)
    return securityToDeviceStatus(status)
  }
}
