import Shell from 'node-powershell'
import log from './logger'
const IS_DEV = process.env.STETHOSCOPE_ENV === 'development'
/*
  NOTE: Don't call node-powershell directly, use this `execPowershell` interface instead
*/
const execPowershell = (cmd, logError = true) => {
  const ps = new Shell({ debugMsg: false })
  return ps.addCommand(cmd).then(() => {
    ps.invoke().then(output => {
      IS_DEV && log.info('powershell:output', output)
      ps.dispose()
      return output
    }).catch(e => {
      ps.dispose()
      // ps._cmds = []
      if (logError !== false) log.error(`powershell error: ${e} | cmd: ${cmd}`)
      return e
    })
  })
}

const openPreferences = pane => {
  return execPowershell(`Get-ControlPanelItem *${pane.replace(/[^\w]/g, '')}* | Show-ControlPanelItem`)
}

const run = cmd => execPowershell(cmd)

export { run, openPreferences }
