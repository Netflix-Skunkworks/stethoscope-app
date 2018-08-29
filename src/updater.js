const { dialog } = require('electron')
const electronUpdater = require('electron-updater')

let updater
let attemptingUpdate = false
let isFirstLaunch
const eventRegistration = {}

// NOTE:
// The actual updating only happens in prod - electron updates (due to Squirrel)
// must be signed, so the process always fails in dev
module.exports = function (env, mainWindow, log = console, OSQuery) {
  const { autoUpdater } = electronUpdater
  autoUpdater.autoDownload = false

  const isDev = env === 'development'

  const eventHandlers = {
    'error': error => {
      // first launch, don't show network errors
      if (isFirstLaunch) return

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
      // no need to show the dialog on first launch
      if (isFirstLaunch) return

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
          setImmediate(() =>
            OSQuery.stop().then(() => autoUpdater.quitAndInstall())
          )
        }
      })
    },
    // TODO move this to ipc, remove mainWindow dependency
    'download-progress': (progressObj) => {
      mainWindow.webContents.send('download:progress', progressObj)
      // NOTE: uncomment to have download update progress displayed over app icon
      mainWindow.setProgressBar(progressObj.percent / 100)
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
    checkForUpdates (menuItem, focusedWindow, event, isLaunch = false) {
      // don't allow multiple concurrent attempts
      attemptingUpdate = true

      if (menuItem) {
        updater = menuItem
        if (updater) updater.enabled = false
      }

      isFirstLaunch = isLaunch

      return autoUpdater.checkForUpdates().catch(err => {
        log.error('Error updating', err)
        isFirstLaunch = false
      })
    }
  }
}
