const { Menu, shell, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')
const config = require('./config.json')
const env = process.env.NODE_ENV || 'production'

// let changelog
let about

module.exports = function (mainWindow, focusOrCreateWindow, env, log) {
  const { checkForUpdates } = require('./updater')(env, mainWindow, log, false)
  const template = [
    { role: 'copy' },
    { role: 'reload' },
    { role: 'close', accelerator: 'CmdOrCtrl+W' },
    {
      label: 'Open Window',
      accelerator: 'CmdOrCtrl+N',
      click () {
        focusOrCreateWindow()
      }
    },
    {
      label: 'Check for Update',
      click (event) {
        checkForUpdates(this, mainWindow, event)
      }
    },
    { role: 'separator' }
  ].concat(
    config.menu.help.map(({ label, link }) => ({
      label,
      click () {
        shell.openExternal(link)
      }
    })),
    { role: 'separator' }
  )

  if (process.platform === 'darwin') {
    template.unshift({ role: 'about' })
  } else if (process.platform === 'win32') {
    template.unshift({
      label: 'About',
      click (event) {
        showAbout()
      }
    })
  }

  if (process.env.NODE_ENV === 'development') {
    template.push({
      label: 'Toggle Developer Tools',
      accelerator: 'Alt+CmdOrCtrl+I',
      click () { mainWindow.toggleDevTools() }
    })
  }

  template.push({ role: 'quit' })

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  return menu
}

const showAbout = () => {
  if (!about) {
    about = new BrowserWindow({
      width: 375,
      height: 285,
      resizable: false,
      titleBarStyle: 'hidden',
      maximizable: false,
      fullscreenable: false
    })
    const dir = env === 'production' ? 'build' : 'public'
    about.loadURL(url.format({
      pathname: path.join(__dirname, `/../${dir}/about.html`),
      protocol: 'file:',
      slashes: true
    }))
    about.on('closed', () => {
      about = null
    })
  }
}
