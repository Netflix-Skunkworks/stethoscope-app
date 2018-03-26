const { protocol, app, ipcMain, remote, dialog, BrowserWindow, session, Tray, nativeImage } = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const yaml = require('js-yaml')
const log = require('electron-log')
const initMenu = require('./Menu')
const applescript = require('./lib/applescript')
const powershell = require('./lib/powershell')
const initProtocols = require('./lib/protocolHandlers')
const env = process.env.NODE_ENV || 'production'
const findIcon = require('./lib/findIcon')(env)
const runLocalServer = require('../server')

let mainWindow
let tray
let appStartTime = Date.now()
let server

const good = nativeImage.createFromPath(findIcon('scope-icon.png'))
const bad =  nativeImage.createFromPath(findIcon('scope-icon-nudge.png'))
const ugly = nativeImage.createFromPath(findIcon('scope-icon-warn.png'))
const statusImages = {
  PASS: good,
  NUDGE: bad,
  FAIL: ugly,
}

const enableDebugger = process.argv.find(arg => arg.includes('enableDebugger'))

function createWindow() {
  // determine if app is already running
  const shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
    }
  });

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
          slashes: true,
        }),
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
      slashes: true,
    }),
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

  const updater = require('./updater')(env, mainWindow)

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const { requestHeaders } = details
    const base = 'stethoscope://main'
    Object.assign(requestHeaders, {
      Origin: base,
      Referrer: base,
    })
    callback({ cancel: false, requestHeaders });
  })

  server = runLocalServer(env, log, {
    setScanStatus(status = 'PASS') {
      tray.setImage(statusImages[status])
    },
    requestUpdate() {
      updater.checkForUpdates()
    }
  })

  server.on('error', (err) => {
    if (err.message.includes('EADDRINUSE')) {
      dialog.showMessageBox({
        message: 'Stethoscope is already running',
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
  const policyUrl = url.replace(/^stethoscope/,'https')
  const params = `policies=${encodeURIComponent(policyUrl)}`
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
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
