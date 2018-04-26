const { app, ipcMain, dialog, BrowserWindow, session, Tray, nativeImage } = require('electron')
const path = require('path')
const url = require('url')
const log = require('winston')
const initMenu = require('./Menu')
const initProtocols = require('./lib/protocolHandlers')
const env = process.env.NODE_ENV || 'production'
const findIcon = require('./lib/findIcon')(env)
const runLocalServer = require('../server')
const moment = require('moment')

let mainWindow,
    tray,
    appStartTime = Date.now(),
    server,
    updater,
    launchIntoUpdater = false,
    deeplinkingUrl

const statusImages = {
  PASS: nativeImage.createFromPath(findIcon('scope-icon.png')),
  NUDGE: nativeImage.createFromPath(findIcon('scope-icon-nudge.png')),
  FAIL: nativeImage.createFromPath(findIcon('scope-icon-warn.png'))
}

const logFolder = path.resolve(app.getPath("userData"));
const logFile = moment().format('YYYY-MM-DD') + '.log';
log.add(log.transports.File, { filename: path.join(logFolder, logFile) });

global.log = log

const enableDebugger = process.argv.find(arg => arg.includes('enableDebugger'))

function createWindow () {
  log.info('starting stethoscope')

  // determine if app is already running
  const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
    }
    if (process.platform == 'win32') {
      // Keep only command line / deep linked arguments
      deeplinkingUrl = commandLine.slice(1)
    }
  })

  if (shouldQuit) {
    app.quit()
    return
  }

  const windowPrefs = {
    width: 480,
    height: 670,
    fullscreenable: false,
    maximizable: false,
    // uncomment the line before to keep window controls but hide title bar
    // titleBarStyle: 'hidden',
    webPreferences: {
      webSecurity: false,
      sandbox: false
    }
  }

  if (process.platform == 'win32') {
    // Keep only command line / deep linked arguments
    deeplinkingUrl = process.argv.slice(1)
  }

  // only allow resize if debugging production build
  if (env === 'production' && !enableDebugger) {
    windowPrefs.resizable = false
  }

  mainWindow = new BrowserWindow(windowPrefs)

  if (tray) tray.destroy()

  tray = new Tray(statusImages.PASS)
  tray.on('click', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    } else {
      mainWindow = new BrowserWindow(windowPrefs)
      initMenu(mainWindow)
      mainWindow.loadURL(
        process.env.ELECTRON_START_URL ||
        url.format({
          pathname: path.join(__dirname, '/../build/index.html'),
          protocol: 'file:',
          slashes: true
        })
      )
    }
  })

  if (enableDebugger) {
    mainWindow.webContents.openDevTools()
  }

  initMenu(mainWindow)

  mainWindow.loadURL(
    process.env.ELECTRON_START_URL ||
    url.format({
      pathname: path.join(__dirname, '/../build/index.html'),
      protocol: 'file:',
      slashes: true
    })
  )

  // adjust window height when download begins and ends
  ipcMain.on('download:start', (event, arg) => {
    mainWindow.setSize(windowPrefs.width, 110, true)
  })

  ipcMain.on('scan:init', (event) => {
    app.setBadgeCount(0)
    mainWindow.setOverlayIcon(null, 'No policy violations')
  })

  ipcMain.on('scan:violation', (event, badgeURI, violationCount) => {
    if (process.platform === 'darwin') {
      app.setBadgeCount(violationCount)
    } else {
      const img = nativeImage.createFromDataURL(badgeURI)
      mainWindow.setOverlayIcon(img, `${violationCount} policy violations`)
    }
  })

  ipcMain.on('download:complete', (event, arg) => {
    mainWindow.setSize(windowPrefs.width, windowPrefs.height, true)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', () => {
  createWindow()
  initProtocols(mainWindow)

  updater = require('./updater')(env, mainWindow)

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

  if (launchIntoUpdater || (deeplinkingUrl && deeplinkingUrl.includes('update'))) {
    log.info('Launching into updater', launchIntoUpdater, deeplinkingUrl)
    updater.checkForUpdates(env, mainWindow).catch(err => {
      log.info('error', err)
    })
  }

  server = runLocalServer(env, log, {
    setScanStatus (status = 'PASS') {
      tray.setImage(statusImages[status])
    },
    requestUpdate () {
      updater.checkForUpdates()
    }
  })

  server.on('error', (err) => {
    if (err.message.includes('EADDRINUSE')) {
      dialog.showMessageBox({
        message: 'Stethoscope is already running'
      })
      app.quit()
    }
  })
})

app.on('before-quit', () => {
  let appCloseTime = Date.now()
  log.debug(`uptime: ${appCloseTime - appStartTime}`)
  if (server && server.listening) {
    server.close()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('open-url', function (event, url) {
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
        log.info('error checking for update', err)
      })
    }
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

process.on('uncaughtException', (err) => {
  if (server && server.listening) {
    server.close()
  }
  console.error('exiting', err)
  process.exit(1)
})
