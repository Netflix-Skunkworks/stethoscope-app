/**
 * This module registers all of the internal protocol handlers
 * Most of them are used in practices/instructions.yaml to take the user
 * where they need to go to resolve issue, but are also used by the web app
 * to trigger actions
 * (e.g. app://some-app opens some-app)
 */
const { protocol } = require('electron')
const os = require('os')
const log = require('./logger')
const applescript = require('./applescript')
const { shell } = require('electron')
const { MAC, WIN } = require('./platform')
const env = process.env.STETHOSCOPE_ENV || 'production'

module.exports = function initProtocols (mainWindow) {
  const { checkForUpdates } = require('../updater')(env, mainWindow)
  const powershell = require('./powershell')

  // used in instructions.yaml
  protocol.registerHttpProtocol('app', (request, cb) => {
    applescript.openApp(decodeURIComponent(request.url.replace('app://', '')))
  })

  // used in instructions.yaml
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

  // handle 'action://update' links to start Stethoscope update process
  protocol.registerHttpProtocol('action', (request, cb) => {
    if (request.url.includes('update')) {
      try {
        checkForUpdates()
      } catch (e) {
        log.error(e)
      }
    }
  })

  // open a URL in the user's default browser
  protocol.registerHttpProtocol('link', (request, cb) => {
    shell.openExternal(request.url.replace('link://', ''))
  })

  // Runs powershell script
  protocol.registerHttpProtocol('ps', (request, cb) => {
    powershell.run(decodeURIComponent(request.url.replace('ps://', '')))
  })

  // uses the shell `open` command to open item
  protocol.registerHttpProtocol('open', (request, cb) => {
    shell.openItem(request.url.replace('open://', ''))
  })
}
