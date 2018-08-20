const macSecurity = require('./MacSecurity')
const macDevice = require('./MacDevice')
const windowsSecurity = require('./WindowsSecurity')
const windowsDevice = require('./WindowsDevice')
const linuxSecurity = require('./LinuxSecurity')
const linuxDevice = require('./LinuxDevice')

module.exports = {
  Security: {
    darwin: macSecurity,
    linux: linuxSecurity,
    ubuntu: linuxSecurity,
    win32: windowsSecurity
  },
  Device: {
    darwin: macDevice,
    linux: linuxDevice,
    ubuntu: linuxDevice,
    win32: windowsDevice
  }
}
