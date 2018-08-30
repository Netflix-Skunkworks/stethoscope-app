const { Menu, shell } = require('electron')
const pkg = require('../package.json')
const config = require('./config.json')

module.exports = function (mainWindow, app, focusOrCreateWindow, updater, log) {
  const { checkForUpdates } = updater
  const contextMenu = [
    { role: 'copy', accelerator: 'CmdOrCtrl+C' },
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

  if (process.env.NODE_ENV === 'development') {
    contextMenu.push({ role: 'toggleDevTools', accelerator: 'Alt+CmdOrCtrl+I' })
  }

  contextMenu.push({ role: 'quit', accelerator: 'CmdOrCtrl+Q' })

  const applicationMenu = Menu.buildFromTemplate([{
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
    { role: 'quit', accelerator: 'CmdOrCtrl+Q' }
    ]
  }].concat(contextMenu))
  Menu.setApplicationMenu(applicationMenu)

  const contextMenuInstance = Menu.buildFromTemplate(contextMenu)
  return contextMenuInstance
}
