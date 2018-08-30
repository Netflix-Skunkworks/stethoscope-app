const { app, ipcMain, globalShortcut, dialog, BrowserWindow, session, Tray, nativeImage } = require('electron')
const path = require('path')
const url = require('url')
const log = require('./lib/logger')
const initMenu = require('./Menu')
const config = require('./config.json')
const { MINIMUM_AUTOSCAN_INTERVAL_SECONDS } = require('./constants')
const settings = require('electron-settings')
const initProtocols = require('./lib/protocolHandlers')
const env = process.env.NODE_ENV || 'production'
const findIcon = require('./lib/findIcon')(env)
const startGraphQLServer = require('../server')
const OSQuery = require('../sources/osquery')
const IS_DEV = env === 'development'
const { IS_MAC, IS_WIN, IS_LINUX } = require('./lib/platform')

const disableAutomaticScanning = settings.get('disableAutomaticScanning')

let mainWindow
let tray
let appStartTime = Date.now()
let server
let updater
let launchIntoUpdater = false
let deeplinkingUrl
let isFirstLaunch = true
let starting = false

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
  // uncomment the line before to keep window controls but hide title bar
  // titleBarStyle: 'hidden',
  webPreferences: {
    webSecurity: false,
    sandbox: false
  }
}

const BASE_URL = process.env.ELECTRON_START_URL || url.format({
  pathname: path.join(__dirname, '/../build/index.html'),
  protocol: 'file:',
  slashes: true
})

// process command line arguments
const enableDebugger = process.argv.find(arg => arg.includes('enableDebugger'))
const DEBUG_MODE = !!process.env.STETHOSCOPE_DEBUG

const focusOrCreateWindow = () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  } else {
    mainWindow = new BrowserWindow(windowPrefs)
    initMenu(mainWindow, app, focusOrCreateWindow, updater, log)
    mainWindow.loadURL(BASE_URL)
  }
}

function createWindow () {
  // determine if app is already running
  const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
    }

    if (IS_WIN) deeplinkingUrl = commandLine.slice(1)

    if (String(deeplinkingUrl).indexOf('update') > -1) {
      updater.checkForUpdates(env, mainWindow, log).catch(err => {
        log.error(`error checking for update: ${err}`)
      })
    }
  })

  if (shouldQuit) {
    return app.quit()
  }

  // wait for process to load before hiding in dock, prevents the app
  // from flashing into view and then hiding
  if (!IS_DEV && IS_MAC) setTimeout(() => app.dock.hide(), 0)
  // windows detection of deep link path
  if (IS_WIN) deeplinkingUrl = process.argv.slice(1)
  // only allow resize if debugging production build
  if (!IS_DEV && !enableDebugger) windowPrefs.resizable = false

  mainWindow = new BrowserWindow(windowPrefs)

  // open developer console if env vars or args request
  if (enableDebugger || DEBUG_MODE) mainWindow.webContents.openDevTools()

  updater = require('./updater')(env, mainWindow, log, OSQuery, server)

  if (isFirstLaunch) {
    updater.checkForUpdates({}, {}, {}, true)
    isFirstLaunch = false
  }

  if (tray) tray.destroy()

  tray = new Tray(statusImages.PASS)
  tray.on('click', focusOrCreateWindow)

  let contextMenu = initMenu(mainWindow, app, focusOrCreateWindow, updater, log)
  tray.on('right-click', () => tray.popUpContextMenu(contextMenu))

  if (!starting) {
    log.info('Starting osquery')
    // these methods allow express to update app state
    const appHooksForServer = {
      setScanStatus (status = 'PASS') {
        if (status in statusImages) {
          next = statusImages[status]
        } else {
          next = statusImages.PASS
        }
        tray.setImage(next)
      },
      requestUpdate () {
        updater.checkForUpdates()
      }
    }
    // ensure that this process doesn't start multiple times
    starting = true

    OSQuery.start().then(() => {
      log.info('osquery started')
      // used to select the appropriate instructions file
      const [ language ] = app.getLocale().split('-')
      // start GraphQL server, close the app if 37370 is already in use
      server = startGraphQLServer(env, log, language, appHooksForServer, OSQuery)
      server.on('error', err => {
        if (err.message.includes('EADDRINUSE')) {
          dialog.showMessageBox({
            message: 'Stethoscope is already running'
          })
          app.quit()
        }
      })

      if (!mainWindow) mainWindow = new BrowserWindow(windowPrefs)

      mainWindow.loadURL(BASE_URL)
      mainWindow.focus()
    }).catch(err => {
      log.info('startup error')
      log.error(`start:osquery unable to start osquery: ${err}`, err)
    })
  }

  // add right-click menu to app
  ipcMain.on('contextmenu', event => contextMenu.popup({ window: mainWindow }))

  // adjust window height when download begins and ends
  ipcMain.on('download:start', () => mainWindow.setSize(windowPrefs.width, 110, true))

  // holds the setTimeout handle
  let rescanTimeout
  const { rescanIntervalSeconds = MINIMUM_AUTOSCAN_INTERVAL_SECONDS } = config
  // ensure minimum delay is 5 minutes
  const scanSeconds = Math.max(MINIMUM_AUTOSCAN_INTERVAL_SECONDS, rescanIntervalSeconds)
  const rescanDelay = rescanIntervalSeconds * 1000

  ipcMain.on('scan:init', event => {
    if (!disableAutomaticScanning) {
      // schedule next automatic scan
      clearTimeout(rescanTimeout)
      rescanTimeout = setTimeout(() => {
        event.sender.send('autoscan:start', { notificationOnViolation: true })
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

  mainWindow.on('closed', () => mainWindow = null)
}

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
    log.info(`Launching into updater: ${launchIntoUpdater}`)
    updater.checkForUpdates(env, mainWindow).catch(err =>
      log.error(`start:launch:check for updates exception${err}`)
    )
  }
}, 0))

app.on('before-quit', () => {
  let appCloseTime = Date.now()
  log.info('stopping osquery')
  OSQuery.stop()
  log.debug(`uptime: ${appCloseTime - appStartTime}`)
  if (server && server.listening) {
    server.close()
  }
})

app.on('window-all-closed', () => {
  // NOTE: this is removed so that closing the main window collapses
  // the app back down to the tray/menubar rather than quitting
  // if (!IS_MAC) app.quit()
})

app.on('open-url', (event, url) => {
  event.preventDefault()

  if (url.includes('update')) {
    launchIntoUpdater = true
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
  OSQuery.stop()
  log.error('exiting on uncaught exception')
  log.error(err)
  process.exit(1)
})
