const { UNSUPPORTED } = require('../constants')
const Shell = require('node-powershell')
const Cache = require('./Cache')

const cache = new Cache()
const shellOptions = {
  debugMsg: false
}

const openPreferences = pane => {
  const cmd = `Get-ControlPanelItem *${pane.replace(/[^\w]/g, '')}* | Show-ControlPanelItem`
  const ps = new Shell(shellOptions)
  ps.addCommand(cmd)
  return ps.invoke()
}

const run = cmd => {
  const ps = new Shell(shellOptions)
  ps.addCommand(cmd)
  return ps.invoke()
}

const getUserId = async () => {
  if (cache.has('getUserId')) {
    return cache.get('getUserId')
  }

  const ps = new Shell(shellOptions)
  ps.addCommand('[System.Security.Principal.WindowsIdentity]::GetCurrent().User | Select Value')
  const output = await ps.invoke()
  // cache for an hour
  cache.set('getUserId', 1000 * 60 * 60)
  return output.split(/[\r\n]+/).pop()
}

const firewallStatus = async () => {
  if (cache.get('firewallStatus')) {
    return cache.get('firewallStatus')
  }

  const ps = new Shell(shellOptions)
  ps.addCommand('netsh advfirewall show allprofiles')
  const output = await ps.invoke().then((output) => {
    const firewalls = ['domainFirewall', 'privateFirewall', 'publicFirewall']
    return output.match(/State[\s\t]*(ON|OFF)/g).reduce((p, c, i) => {
      p[firewalls[i]] = c.includes('ON') ? 'ON' : 'OFF'
      return p
    }, {})
  })
  // cache for 10 seconds
  cache.set('firewallStatus', output, 1000 * 10)
  return output
}

const getScreenLockActive = async () => {
  if (cache.get('getScreenLockActive')) {
    return cache.get('getScreenLockActive')
  }

  const ps = new Shell(shellOptions)
  const commands = [
    `$key = 'HKCU:\\Control Panel\\Desktop'`,
    `$name = 'ScreenSaveActive'`,
    '(Get-ItemProperty -Path $key -Name $name).$name'
  ]
  ps.addCommand(commands.join(';'))
  const output = await ps.invoke()
  // cache for 10 seconds
  cache.set('getScreenLockActive', output.includes('1'), 1000 * 10)
  return output.includes('1')
}

// I'm sorry
//   - rmcvey
// Screen lock timeout is stored in powercfg settings, in order to get that
// information, we have to determine which powerscheme is being used and query
// the subkeys (DISPLAY > SCREEN SLEEP) under that. The output is incredibly
// verbose, hence all of the string parsing.
const getScreenLockTimeout = async () => {
  if (cache.get('getScreenLockTimeout')) {
    return cache.get('getScreenLockTimeout')
  }

  const ps = new Shell(shellOptions)
  // determine the GUID of the user's active power scheme
  ps.addCommand('powercfg /getactivescheme')
  const output = await ps.invoke()
  const match = output.match(/:\s([\w-]+)/)
  let activePowerGUID = null

  let response = {
    pluggedIn: Infinity,
    battery: Infinity
  }

  if (match && match.length) {
    activePowerGUID = match[1]
  }

  if (activePowerGUID) {
    const ps = new Shell(shellOptions)
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
    response = {
      pluggedIn: parseInt(data['Current AC Power Setting Index'], 16),
      battery: parseInt(data['Current DC Power Setting Index'], 16)
    }
  }

  // cache for 10 seconds
  cache.set('getScreenLockTimeout', response, 1000 * 10)
  return response
}

const getDisableLockWorkStation = async () => {
  if (cache.get('getDisableLockWorkStation')) {
    return cache.get('getDisableLockWorkStation')
  }

  const commands = [
    '$name = "DisableLockWorkStation"',
    '$key = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System"',
    '(Get-ItemProperty -Path $key -Name $name).$name'
  ]

  const ps = new Shell(shellOptions)
  ps.addCommand(commands.join('; '))

  try {
    const output = await ps.invoke()
    cache.set('getDisableLockWorkStation', true, 1000 * 10)
    return !!output
  } catch (e) {
    cache.set('getDisableLockWorkStation', false, 1000 * 10)
    return false
  }
}

const disks = async (disks = []) => {
  if (cache.get('disks')) {
    return cache.get('disks')
  }

  const status = await Promise.all(
    disks.map(async ({ label }) => {
      const ps = new Shell(shellOptions)
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

  // cache for 10 minutes
  cache.set('disks', status, 1000 * 60 * 10)

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
