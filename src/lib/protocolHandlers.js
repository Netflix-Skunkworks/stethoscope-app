const { protocol } = require('electron')
const os = require('os')
const log = require('./logger')
const applescript = require('./applescript')
const { shell } = require('electron')
const { MAC, WIN } = require('./platform')
const env = process.env.NODE_ENV || 'production'

module.exports = function initProtocols (mainWindow) {
  const { checkForUpdates } = require('../updater')(env, mainWindow)
  const powershell = require('./powershell')

  protocol.registerHttpProtocol('app', (request, cb) => {
    applescript.openApp(decodeURIComponent(request.url.replace('app://', '')))
  })

  protocol.registerHttpProtocol('prefs', (request, cb) => {
    const pref = decodeURIComponent(request.url.replace('prefs://', ''))
    switch (os.platform()) {
      case MAC:
        applescript.openPreferences(pref)
        break
      case WIN:
        powershell.openPreferences(pref)
        break
      default:
        break
    }
  })

  protocol.registerHttpProtocol('action', (request, cb) => {
    if (request.url.includes('update')) {
      try {
        checkForUpdates()
      } catch (e) {
        log.error(e)
      }
    }
  })

  protocol.registerHttpProtocol('link', (request, cb) => {
    shell.openExternal(request.url.replace('link://', ''))
  })

  protocol.registerHttpProtocol('ps', (request, cb) => {
    powershell.run(decodeURIComponent(request.url.replace('ps://', '')))
  })
}
