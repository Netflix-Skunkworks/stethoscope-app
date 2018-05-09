const { UNSUPPORTED } = require('../constants')
let Shell
let ps

if (process.platform === 'win32') {
  Shell = require('node-powershell')
  ps = new Shell({
    debugMsg: false
  })
}

const openPreferences = pane => {
  const cmd = `Get-ControlPanelItem *${pane.replace(/[^\w]/g, '')}* | Show-ControlPanelItem`
  ps._cmds = []
  ps.addCommand(cmd)
  return ps.invoke()
}

const run = cmd => {
  ps._cmds = []
  ps.addCommand(cmd)
  return ps.invoke()
}

const getUserId = async () => {
  ps._cmds = []
  ps.addCommand('[System.Security.Principal.WindowsIdentity]::GetCurrent().User | Select Value')
  const output = await ps.invoke()
  return output.split(/[\r\n]+/).pop()
}

const firewallStatus = async () => {
  ps._cmds = []
  ps.addCommand('netsh advfirewall show allprofiles')
  const output = await ps.invoke().then((output) => {
    const firewalls = ['domainFirewall', 'privateFirewall', 'publicFirewall']
    return output.match(/State[\s\t]*(ON|OFF)/g).reduce((p, c, i) => {
      p[firewalls[i]] = c.includes('ON') ? 'ON' : 'OFF'
      return p
    }, {})
  })
  return output
}

const getScreenLockActive = async () => {
  ps._cmds = []
  const commands = [
    `$key = 'HKCU:\\Control Panel\\Desktop'`,
    `$name = 'ScreenSaveActive'`,
    '(Get-ItemProperty -Path $key -Name $name).$name'
  ]
  ps.addCommand(commands.join(';'))
  const output = await ps.invoke()
  return output.includes('1')
}

// I'm sorry
//   - rmcvey
// Screen lock timeout is stored in powercfg settings, in order to get that
// information, we have to determine which powerscheme is being used and query
// the subkeys (DISPLAY > SCREEN SLEEP) under that. The output is incredibly
// verbose, hence all of the string parsing.
const getScreenLockTimeout = async () => {
  ps._cmds = []
  // determine the GUID of the user's active power scheme
  ps.addCommand('powercfg /getactivescheme')
  const output = await ps.invoke()
  const match = output.match(/:\s([\w-]+)/)
  let activePowerGUID = null

  if (match && match.length) {
    activePowerGUID = match[1]
  }

  if (activePowerGUID) {
    ps._cmds = []
    // ewwwwww
    const displayGUID = '7516b95f-f776-4464-8c53-06167f40cc99'
    const screenSleepGUID = '3c0bc021-c8a8-4e07-a973-6b14cbcb2b7e'
    const query = `powercfg /query ${activePowerGUID} ${displayGUID} ${screenSleepGUID}`
    ps.addCommand(query)
    const out = await ps.invoke()
    const data = out.split(/([\r\n]+)/)
        .filter(i => i !== '\n')
        .map(l => l.trim().split(': '))
        .reduce((p, [key, value]) => {
          p[key] = value
          return p
        }, {})

    // values come back as hex, convert to int Seconds
    return {
      pluggedIn: parseInt(data['Current AC Power Setting Index'], 16),
      battery: parseInt(data['Current DC Power Setting Index'], 16),
    }
  }

  // something went wrong, assume they have no timeout set
  return {
    pluggedIn: Infinity,
    battery: Infinity
  }
}

const getDisableLockWorkStation = async () => {
  const commands = [
    '$name = "DisableLockWorkStation"',
    '$key = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System"',
    '(Get-ItemProperty -Path $key -Name $name).$name'
  ]

  ps._cmds = []
  ps.addCommand(commands.join('; '))

  try {
    const output = await ps.invoke()
    return true
  } catch (e) {
    return false
  }
}

const disks = async (disks = []) => {
  const status = await Promise.all(
    disks.map(async ({ label }) => {
      ps._cmds = []
      let encrypted

      try {
        ps.addCommand(`manage-bde -status ${label}`)
        const out = await ps.invoke()
        const data = out.split(/[\r\n]+/)
           .map(line =>
             line.trim().split(':').map(w => w.trim())
           ).reduce((p, [key, value]) => {
             p[key] = value
             return p
           }, {})

        encrypted = data && data['Percentage Encrypted'] === '100%'
      } catch (e) {
        encrypted = UNSUPPORTED
      }

      return {
        label,
        name: label,
        encrypted
      }
    })
  )
  return status
}

module.exports = {
  run,
  openPreferences,
  getScreenLockTimeout,
  getScreenLockActive,
  getUserId,
  disks,
  firewallStatus,
  getDisableLockWorkStation
}
