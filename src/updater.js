const { dialog } = require('electron')
const { autoUpdater } = require('electron-updater')

let updater
let attemptingUpdate = false
const eventRegistration = {}

// NOTE:
// The actual updating only happens in prod - electron updates (due to Squirrel)
// must be signed, so the process always fails in dev
module.exports = function(env) {
  autoUpdater.autoDownload = false
  const isDev = env === 'development'

  const eventHandlers = {
    'error': error => {
      let err = (isDev ? error.stack : error.message).toString()
      if (error.message.includes('ERR_CONNECTION_REFUSED')) {
        err = 'Update server unavailable'
      }

      if (attemptingUpdate) {
        dialog.showErrorBox('Error Updating: ', error ? err : 'unknown')
        attemptingUpdate = false
      }
    },
    'update-available': () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Found Updates',
        message: 'Found updates, do you want update now?',
        buttons: ['Sure', 'No']
      }, (buttonIndex) => {
        if (buttonIndex === 0) {
          if (!isDev) {
            autoUpdater.downloadUpdate()
          } else {
            if (updater) updater.enabled = true
            attemptingUpdate = false
            updater = null
            dialog.showMessageBox({
              title: 'Downloading',
              message: 'App cannot be updated in dev mode'
            })
          }
        }
      })
    },
    'update-not-available': () => {
      dialog.showMessageBox({
        title: 'No Updates',
        message: 'Current version is up-to-date.'
      })
      attemptingUpdate = false
      if (updater) updater.enabled = true
      updater = null
    },
    'update-downloaded': () => {
      dialog.showMessageBox({
        title: 'Install Updates',
        message: 'Updates downloaded, application will be quit for update...'
      }, () => {
        if (!isDev) {
          setImmediate(() => autoUpdater.quitAndInstall())
        }
      })
    }
  }

  for (let eventName in eventHandlers) {
    // prevent from being registered multiple times
    if (!(eventName in eventRegistration)) {
      eventRegistration[eventName] = true
      autoUpdater.on(eventName, eventHandlers[eventName])
    }
  }

  return {
    checkForUpdates (menuItem, focusedWindow, event) {
      attemptingUpdate = true
      if (menuItem) {
        updater = menuItem
        if (updater) updater.enabled = false
      }
      autoUpdater.checkForUpdates().catch(() => {})
    }
  }
}
