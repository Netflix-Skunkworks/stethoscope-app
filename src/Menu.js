const { app, Menu, shell, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')
const config = require('./config.json')
const env = process.env.NODE_ENV || 'production'

// let changelog
let about

module.exports = function (mainWindow, env, log) {
  const { checkForUpdates } = require('./updater')(env, mainWindow, log, false)
  const template = [
    // { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
    // { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
    {
      label: 'Check for Update',
      click (event) {
        checkForUpdates(this, mainWindow, event)
      }
    },
    { role: 'separator' },
  ].concat(
    config.menu.help.map(({label, link}) => ({ label, click () { shell.openExternal(link) }})),
    { role: 'separator' },
    { role: 'quit' }
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
      accelerator: 'Alt+Command+I',
      click () { mainWindow.toggleDevTools() }
    }, {
      label: 'Reload',
      accelerator: 'Command+R',
      click () { mainWindow.reload() }
    })
  }

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
