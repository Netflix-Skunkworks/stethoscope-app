const settings = require('electron-settings')
const AutoLaunch = require('auto-launch')
const config = require('./config.json')
const os = require('os')

class AutoLauncher {
  constructor () {
    const autoLaunchOpts = {
      name: 'Stethoscope',
      isHidden: true
    }
    if (os.platform() === 'linux' && process.env.APPIMAGE) {
      autoLaunchOpts.path = process.env.APPIMAGE
    }
    this.stethoscopeAutoLauncher = new AutoLaunch(autoLaunchOpts)
  }

  shouldPromptToEnable () {
    return config.autoLaunchPrompt && !settings.has('autoLaunch')
  }

  isEnabled () {
    return settings.get('autoLaunch') === 'true'
  }

  disable () {
    this.stethoscopeAutoLauncher.isEnabled().then((isEnabled) => {
      if (isEnabled) {
        this.stethoscopeAutoLauncher.disable()
      }
    })
    settings.set('autoLaunch', 'false')
  }

  enable () {
    this.stethoscopeAutoLauncher.isEnabled().then((isEnabled) => {
      if (!isEnabled) {
        this.stethoscopeAutoLauncher.enable()
      }
    })
    settings.set('autoLaunch', 'true')
  }
}

module.exports = AutoLauncher
