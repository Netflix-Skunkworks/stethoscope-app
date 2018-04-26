const { dialog } = require('electron')
const { autoUpdater } = require('electron-updater')

let updater
let attemptingUpdate = false
const eventRegistration = {}

// NOTE:
// The actual updating only happens in prod - electron updates (due to Squirrel)
// must be signed, so the process always fails in dev
module.exports = function (env, mainWindow) {
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
        message: 'New version available, do you want update now?',
        buttons: ['Yes', 'No']
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
        message: 'You already have the latest version.'
      })
      attemptingUpdate = false
      if (updater) updater.enabled = true
      updater = null
    },
    'update-downloaded': () => {
      dialog.showMessageBox({
        title: 'Install Updates',
        message: 'Updates downloaded, Stethoscope will quit and relaunch.'
      }, () => {
        if (!isDev) {
          setImmediate(() => autoUpdater.quitAndInstall())
        }
      })
    },
    'download-progress': (progressObj) => {
      mainWindow.webContents.send('download:progress', progressObj)
      // NOTE: uncomment to have download update progress displayed over app icon
      // mainWindow.setProgressBar(progressObj.percent / 100)
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
      return autoUpdater.checkForUpdates()
    }
  }
}
