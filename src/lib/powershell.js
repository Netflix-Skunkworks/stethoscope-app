const { UNKNOWN } = require('../constants')
const Shell = require('node-powershell')
const log = require('./logger')
const IS_DEV = process.env.NODE_ENV === 'development'

const cache = new Map()
const timers = new Map()
/*
  NOTE: Don't call node-powershell directly, use this `execPowershell` interface instead
*/
const execPowershell = (cmd, logError = true) => {
  if (cache.has(cmd)) return cache.get(cmd)
  const ps = new Shell({ debugMsg: false })

  return cache.set(cmd, new Promise((resolve, reject) => {
    let start = process.hrtime()

    ps.addCommand(cmd).then(() => {
      ps.invoke().then(output => {
        const [s, n] = process.hrtime(start)
        const nanoseconds = (s * 1e9 + n)
        const milliseconds = nanoseconds * 1e-6
        const end = Math.floor(milliseconds * 100) / 100
        timers.set(cmd, end)
        IS_DEV && log.info('powershell:output', output)
        resolve(output)
        ps.dispose()
      }).catch(e => {
        ps.dispose()
        // ps._cmds = []
        if (logError !== false) log.error(`powershell error: ${e} | cmd: ${cmd}`)
        reject(new Error(e))
      })
    })
  })).get(cmd)
}

function getTimingInfo () {
  const timerValues = [...timers.values()]
  const queries = [...timers.entries()]

  timers.clear()

  return {
    total: timerValues.reduce((p, v) => p + v, 0),
    queries
  }
}

function flushCache () {
  cache.clear()
}

const openPreferences = pane => {
  return execPowershell(`Get-ControlPanelItem *${pane.replace(/[^\w]/g, '')}* | Show-ControlPanelItem`)
}

const run = cmd => execPowershell(cmd)

const getUserId = async () => {
  try {
    const output = await execPowershell('[System.Security.Principal.WindowsIdentity]::GetCurrent().User | Select Value')
    return output.split(/[\r\n]+/).pop()
  } catch (e) {
    return UNKNOWN
  }
}

const firewallStatus = async () => {
  try {
    const output = await execPowershell('netsh advfirewall show allprofiles')
    const firewalls = ['domainFirewall', 'privateFirewall', 'publicFirewall']
    return output.match(/State[\s\t]*(ON|OFF)/g).reduce((p, c, i) => {
      p[firewalls[i]] = c.includes('ON') ? 'ON' : 'OFF'
      return p
    }, {})
  } catch (e) {
    return {
      domainFirewall: UNKNOWN,
      privateFirewall: UNKNOWN,
      publicFirewall: UNKNOWN
    }
  }
}

const getScreenLockActive = async () => {
  const commands = [
    `$key = 'HKCU:\\Control Panel\\Desktop'`,
    `$name = 'ScreenSaveActive'`,
    '(Get-ItemProperty -Path $key -Name $name).$name'
  ]
  try {
    const output = await execPowershell(commands.join(';'))
    return output.includes('1')
  } catch (e) {
    return UNKNOWN
  }
}

// I'm sorry
//   - rmcvey
// Screen lock timeout is stored in powercfg settings, in order to get that
// information, we have to determine which powerscheme is being used and query
// the subkeys (DISPLAY > SCREEN SLEEP) under that. The output is incredibly
// verbose, hence all of the string parsing.
const getScreenLockTimeout = async () => {
  // determine the GUID of the user's active power scheme
  const output = await execPowershell('powercfg /getactivescheme')
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
    const displayGUID = '7516b95f-f776-4464-8c53-06167f40cc99'
    const screenSleepGUID = '3c0bc021-c8a8-4e07-a973-6b14cbcb2b7e'
    const query = `powercfg /query ${activePowerGUID} ${displayGUID} ${screenSleepGUID}`
    const out = await execPowershell(query)
    const data = out.split(/([\r\n]+)/)
      .filter(i => i !== '\n')
      .map(l => l.trim().split(': '))
      .reduce((p, [key, value]) => {
        p[key] = value
        return p
      }, {})

    // values come back as hex, convert to int Seconds
    response = {
      pluggedIn: parseInt(data['Current AC Power Setting Index'], 16) || Infinity,
      battery: parseInt(data['Current DC Power Setting Index'], 16) || Infinity
    }
  }
  return response
}

const getDisableLockWorkStation = async () => {
  const commands = [
    '$name = "DisableLockWorkStation"',
    '$key = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System"',
    '(Get-ItemProperty -Path $key -Name $name).$name'
  ]

  try {
    await execPowershell(commands.join('; '), false)
    return true
  } catch (e) {
    return false
  }
}

module.exports = {
  flushCache,
  run,
  openPreferences,
  getScreenLockTimeout,
  getScreenLockActive,
  getTimingInfo,
  getUserId,
  firewallStatus,
  getDisableLockWorkStation
}
