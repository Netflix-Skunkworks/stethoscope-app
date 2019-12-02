/**
 * main entry point for the electron app. This file configures and initializes
 * the entire application which includes:
 *  - Handle launch/deeplink events
 *  - Initialize custom protocols used within the app (e.g. app://foo, ps://bar)
 *  - Initialize auto launch behavior
 *  - Create the BrowserWindow (stored as global.app for use throughout the app)
 *  - initialize app menus and dock/tray behavior
 *  - Start the GraphQL (express) server
 *  - handle server triggered events (e.g. changing app icon based on policy result)
 *  - Handle uncaught exceptions in any part of the app
 *  - Handle IPC calls from other parts of the application
 *    - 'scan:init' - Automatic update triggered (resizes app, displays progress)
 *    - 'app:loaded' - Notify when client side app is loaded
 *    - 'download:completed' - update has finished downloading
 */
import path from 'path'
import { app, ipcMain, dialog, BrowserWindow, nativeTheme, session, Tray, nativeImage } from 'electron'
import url from 'url'
import log from './lib/logger'
import initMenu from './Menu'
import config from './config.json'
import { MINIMUM_AUTOSCAN_INTERVAL_SECONDS } from './constants'
import settings from 'electron-settings'
import serializeError from 'serialize-error'
import initProtocols from './lib/protocolHandlers'
import loadReactDevTools from './lib/loadReactDevTools'
import iconFinder from './lib/findIcon'
import startGraphQLServer from './server'
import { IS_LINUX, IS_MAC, IS_WIN } from './lib/platform'
import AutoLauncher from './AutoLauncher'
import updateInit from './updater'

const env = process.env.STETHOSCOPE_ENV || 'production'
const findIcon = iconFinder(env)
const IS_DEV = env === 'development'
const IS_TEST = !!process.argv.find(arg => arg.includes('testMode'))
const disableAutomaticScanning = settings.get('disableAutomaticScanning')

let mainWindow
let tray
const appStartTime = Date.now()
let server
let updater
let launchIntoUpdater = false
let deeplinkingUrl
let isLaunching = true
let isFirstLaunch = false
// icons that are displayed in the Menu bar
const statusImages = {
  PASS: nativeImage.createFromPath(findIcon('scope-icon-ok2@2x.png')),
  NUDGE: nativeImage.createFromPath(findIcon('scope-icon-nudge2@2x.png')),
  FAIL: nativeImage.createFromPath(findIcon('scope-icon-warn2@2x.png'))
}

const windowPrefs = {
  width: 480,
  height: 670,
  fullscreenable: false,
  maximizable: false,
  autoHideMenuBar: true,
  skipTaskbar: true,
  webPreferences: {
    nodeIntegration: true,
    webSecurity: false,
    contextIsolation: false,
    sandbox: false
  }
}

// use build/ assets in production, webpack HMR server in dev
const BASE_URL = process.env.ELECTRON_START_URL || url.format({
  pathname: path.join(__dirname, '/../build/index.html'),
  protocol: 'file:',
  slashes: true
})

// process command line arguments
let enableDebugger = process.argv.find(arg => arg.includes('enableDebugger'))
const DEBUG_MODE = !!process.env.STETHOSCOPE_DEBUG

const focusOrCreateWindow = (mainWindow) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
      return mainWindow
    }
    mainWindow.destroy()
  }
  mainWindow = new BrowserWindow(windowPrefs)
  initMenu(mainWindow, app, focusOrCreateWindow, updater, log)
  mainWindow.loadURL(BASE_URL)
  return mainWindow
}

async function createWindow () {
  // used to show initial launch messages to user
  if (!settings.has('userHasLaunchedApp')) {
    isFirstLaunch = true
    settings.set('userHasLaunchedApp', true)
  }
  // wait for process to load before hiding in dock, prevents the app
  // from flashing into view and then hiding
  if (!IS_DEV && IS_MAC) setImmediate(() => app.dock.hide())
  // windows detection of deep link path
  if (IS_WIN) deeplinkingUrl = process.argv.slice(1)
  // only allow resize if debugging production build
  if (!IS_DEV && !enableDebugger) windowPrefs.resizable = false

  mainWindow = new BrowserWindow(windowPrefs)

  if (IS_DEV) loadReactDevTools(BrowserWindow)
  // open developer console if env vars or args request
  if (enableDebugger || DEBUG_MODE) {
    mainWindow.webContents.openDevTools()
  }

  // required at run time so dependencies can be injected
  updater = updateInit(env, mainWindow, log, server, focusOrCreateWindow)

  if (isLaunching) {
    updater.checkForUpdates({}, {}, {}, true)
    // check for updates in background
    const EVERY_DAY = 86400 * 1000
    setInterval(() => updater.checkForUpdates({}, {}, {}, true), EVERY_DAY)
    isLaunching = false
  }

  if (isFirstLaunch && !IS_TEST) {
    dialog.showMessageBox({
      type: 'info',
      title: 'Auto Launch',
      message: 'Would you like to automatically launch Stethoscope on start-up?',
      buttons: ['Yes', 'No']
    }, (buttonIndex) => {
      const autoLauncher = new AutoLauncher(app.name)
      if (buttonIndex === 0) {
        autoLauncher.enable()
      } else {
        autoLauncher.disable()
      }
    })
    isLaunching = false
  }

  if (tray) tray.destroy()

  tray = new Tray(statusImages.PASS)
  tray.on('click', () => {
    mainWindow = focusOrCreateWindow(mainWindow)
  })

  tray.on('right-click', () => tray.popUpContextMenu(initMenu(mainWindow, app, focusOrCreateWindow, updater, log)))

  // these methods allow express to update app state
  const appHooksForServer = {
    setScanStatus (status = 'PASS') {
      let next = statusImages.PASS
      if (status in statusImages) {
        next = statusImages[status]
      }
      tray.setImage(next)
    },
    requestUpdate () {
      updater.checkForUpdates()
    },
    enableDebugger: enableAppDebugger,
    requestLogPermission (origin) {
      return new Promise((resolve, reject) => {
        dialog.showMessageBox({
          type: 'info',
          title: 'Allow Access',
          message: `Will you allow your Stethoscope log files to be sent to ${origin}?`,
          buttons: ['Yes', 'No']
        }, (buttonIndex) => {
          if (buttonIndex === 0) {
            resolve()
          } else {
            reject(new Error('Access denied'))
          }
        })
      })
    }
  }

  // used to select the appropriate instructions file
  const [language] = app.getLocale().split('-')
  // start GraphQL server, close the app if 37370 is already in use
  server = await startGraphQLServer(env, log, language, appHooksForServer)
  server.on('error', error => {
    log.info(`startup:express:error ${JSON.stringify(serializeError(error))}`)
    if (error.message.includes('EADDRINUSE')) {
      dialog.showMessageBox({
        message: 'Something is already using port 37370'
      })
    }
  })

  server.on('server:ready', () => {
    if (!mainWindow) mainWindow = new BrowserWindow(windowPrefs)
    mainWindow.loadURL(BASE_URL)
    mainWindow.focus()
  })

  // add right-click menu to app
  ipcMain.on('contextmenu', event => initMenu(mainWindow, app, focusOrCreateWindow, updater, log).popup({ window: mainWindow }))

  // allow web app to restart application
  ipcMain.on('app:restart', () => {
    if (server && server.listening) {
      server.close()
    }
    app.relaunch()
    app.quit()
  })

  // adjust window height when download begins and ends
  ipcMain.on('download:start', () => mainWindow.setSize(windowPrefs.width, 110, true))

  // holds the setTimeout handle
  let rescanTimeout
  const { rescanIntervalSeconds = MINIMUM_AUTOSCAN_INTERVAL_SECONDS } = config
  // ensure minimum delay is 5 minutes
  const scanSeconds = Math.max(MINIMUM_AUTOSCAN_INTERVAL_SECONDS, rescanIntervalSeconds)
  const rescanDelay = scanSeconds * 1000

  ipcMain.on('scan:init', event => {
    if (!disableAutomaticScanning) {
      // schedule next automatic scan
      clearTimeout(rescanTimeout)
      rescanTimeout = setTimeout(() => {
        if (event && event.sender) {
          event.sender.send('autoscan:start', { notificationOnViolation: true })
        }
      }, rescanDelay)
    }
  })

  // restore main window after update is downloaded (if arg = { resize: true })
  ipcMain.on('download:complete', (event, arg) => {
    if (arg && arg.resize) {
      mainWindow.setSize(windowPrefs.width, windowPrefs.height, true)
    }
  })

  // wait for app to finish loading before attempting auto update from deep link (stethoscope://update)
  ipcMain.on('app:loaded', () => {
    if (String(deeplinkingUrl).indexOf('update') > -1) {
      updater.checkForUpdates(env, mainWindow).then(err => {
        if (err) {
          log.error(`start:loaded:deeplink error checking for update${err}`)
        }
        deeplinkingUrl = ''
      }).catch(err => {
        deeplinkingUrl = ''
        log.error(`start:exception on check for update ${err}`)
      })
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function enableAppDebugger () {
  if (mainWindow) {
    mainWindow.webContents.openDevTools()
    mainWindow.setResizable(true)
  }
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (IS_WIN) deeplinkingUrl = commandLine.slice(1)

    if (String(deeplinkingUrl).indexOf('update') > -1) {
      updater.checkForUpdates(env, mainWindow, log).catch(err => {
        log.error(`error checking for update: ${err}`)
      })
    }

    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // wrap ready callback in 0-delay setTimeout to reduce serious jank
  // issues on Windows
  app.on('ready', () => setTimeout(() => {
    createWindow()
    initProtocols(mainWindow)

    // override internal request origin to give express CORS policy something to check
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      const { requestHeaders } = details
      const base = 'stethoscope://main'
      Object.assign(requestHeaders, {
        Origin: base,
        Referrer: base
      })
      const args = { cancel: false, requestHeaders }
      callback(args)
    })

    if (launchIntoUpdater) {
      // triggered via stethoscope://update app link
      log.info(`Launching into updater: ${launchIntoUpdater}`)
      updater.checkForUpdates(env, mainWindow).catch(err =>
        log.error(`start:launch:check for updates exception${err}`)
      )
    }
  }, 0))
}

app.on('before-quit', () => {
  const appCloseTime = Date.now()

  log.debug(`uptime: ${appCloseTime - appStartTime}`)
  if (server && server.listening) {
    server.close()
  }
})

app.on('open-url', (event, url) => {
  event.preventDefault()

  if (url.includes('update')) {
    launchIntoUpdater = true
  }

  if (url.includes('debugger')) {
    if (!mainWindow) {
      enableDebugger = true
      createWindow()
    } else {
      enableAppDebugger()
    }
  }

  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()

    if (launchIntoUpdater) {
      updater.checkForUpdates(env, mainWindow).catch(err => {
        log.error(`start:check for updates error: ${err}`)
      })
    }
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

process.on('uncaughtException', err => {
  if (server && server.listening) {
    server.close()
  }
  log.error('exiting on uncaught exception')
  log.error(err.message)
  log.error(err.stack)
  process.exit(1)
})

app.on('window-all-closed', () => {
  if (IS_LINUX) {
    app.quit()
  }
})

export {}
