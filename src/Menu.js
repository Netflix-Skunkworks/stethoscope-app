const { Menu, shell, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')
const pkg = require('../package.json')
const config = require('./config.json')
const settings = require('electron-settings')
const env = process.env.NODE_ENV || 'production'

// let changelog
let about

module.exports = function (mainWindow, app, focusOrCreateWindow, env, log) {
  const { checkForUpdates } = require('./updater')(env, mainWindow, log, false)
  const contextMenu = [
    { role: 'copy', accelerator: 'CmdOrCtrl+C' },
    {
      label: 'Preferences',
      submenu: [{
        label: 'Keep in Dock',
        id: 'keep-in-dock',
        type: 'checkbox',
        checked: !!settings.get('showInDock') === false,
        click () {
          settings.set('showInDock', true)
          app.dock.show()
          mainWindow.setSkipTaskbar(false)
          mainWindow.setAutoHideMenuBar(false)
          applicationMenu.getMenuItemById('keep-in-dock').checked = true
          applicationMenu.getMenuItemById('tray-only-app').checked = false
        }
      },
      {
        label: 'Tray Only',
        id: 'tray-only-app',
        type: 'checkbox',
        checked: !!settings.get('showInDock') === true,
        click () {
          settings.set('showInDock', false)
          app.dock.hide()
          mainWindow.setSkipTaskbar(true)
          mainWindow.setAutoHideMenuBar(true)
          applicationMenu.getMenuItemById('keep-in-dock').checked = false
          applicationMenu.getMenuItemById('tray-only-app').checked = true
        }
      }]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'reload' },
        { role: 'close', accelerator: 'CmdOrCtrl+W' },
        {
          label: 'Open Window',
          accelerator: 'CmdOrCtrl+N',
          click () {
            focusOrCreateWindow()
          }
        }
      ]
    },
    {
      label: 'Check for Update',
      click (event) {
        checkForUpdates(this, mainWindow, event)
      }
    },
    { role: 'separator', enabled: false }
  ].concat({
      label: 'Help',
      submenu: config.menu.help.map(({ label, link }) => ({
        label,
        click () {
          shell.openExternal(link)
        }
      })).concat({
        label: `Stethoscope version ${pkg.version}`,
        enabled: false
      })
    },
    { role: 'separator', enabled: false }
  )

  // easy clone of template
  const appMenu = JSON.parse(JSON.stringify(contextMenu))
  appMenu.unshift({
    label: app.getName(),
    submenu: [{
        label: `Stethoscope version ${pkg.version}`,
        enabled: false
      },
      {
        label: 'Check for Update',
        click (event) {
          checkForUpdates(this, mainWindow, event)
        }
      },
      { role: 'copy', accelerator: 'CmdOrCtrl+C' },
      { role: 'quit', accelerator: 'CmdOrCtrl+Q' },
    ]
  })

  if (process.env.NODE_ENV === 'development') {
    contextMenu.push({ role: 'toggleDevTools', accelerator: 'Alt+CmdOrCtrl+I' })
  }

  contextMenu.push({ role: 'quit', accelerator: 'CmdOrCtrl+Q' })

  const applicationMenu = Menu.buildFromTemplate(appMenu)
  Menu.setApplicationMenu(applicationMenu)

  return Menu.buildFromTemplate(contextMenu)
}
