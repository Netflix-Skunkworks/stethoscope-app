import settings from 'electron-settings'
import AutoLaunch from 'auto-launch'
import config from './config.json'
import os from 'os'

export default class AutoLauncher {
  constructor (appName) {
    const autoLaunchOpts = {
      isHidden: true,
      name: appName || 'Stethoscope'
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
