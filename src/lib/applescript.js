import applescript from 'applescript'
import { promisify } from 'util'
const execString = promisify(applescript.execString)

const openPreferences = async function (preferencePaneId) {
  // only allow letters and ., we don't want any applescript injection attacks
  const safePreferencePaneId = preferencePaneId.replace(/[^\w.]/g, '')
  const script = `tell application "System Preferences"
    activate
    set the current pane to pane id "${safePreferencePaneId}"
  end tell`
  return execString(script)
}

const openApp = async function (appName) {
  // only allow letters and spaces, we don't want any applescript injection attacks
  const safeAppName = appName.replace(/[^\w ]/g, '')
  const script = `tell application "${safeAppName}"
    activate
  end tell`
  return execString(script)
}

export default {
  openPreferences,
  openApp
}

if (require.main === module) {
  // openPreferences(');com.apple.preference.security')
  openApp('App Store')
}
