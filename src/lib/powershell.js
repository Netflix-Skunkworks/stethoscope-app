const { UNKNOWN } = require('../constants')
const Shell = require('node-powershell')
const log = require('./logger')
const IS_DEV = process.env.NODE_ENV === 'development'
/*
  NOTE: Don't call node-powershell directly, use this `execPowershell` interface instead
*/
const execPowershell = (cmd, logError = true) => {
  const ps = new Shell({ debugMsg: false })

  return cache.set(cmd, new Promise((resolve, reject) => {
    ps.addCommand(cmd).then(() => {
      ps.invoke().then(output => {
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

const openPreferences = pane => {
  return execPowershell(`Get-ControlPanelItem *${pane.replace(/[^\w]/g, '')}* | Show-ControlPanelItem`)
}

const run = cmd => execPowershell(cmd)

module.exports = {
  run,
  openPreferences
}
