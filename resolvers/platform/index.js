const macSecurity = require('./MacSecurity')
const macDevice = require('./MacDevice')
const windowsSecurity = require('./WindowsSecurity')
const windowsDevice = require('./WindowsDevice')

module.exports = {
  Security: {
    darwin: macSecurity,
    win32: windowsSecurity
  },
  Device: {
    darwin: macDevice,
    win32: windowsDevice
  }
}
