const { spawn } = require('child_process')
const { MAC, WIN } = require('./platform')
const ps = require('./powershell')

const darwinUpdates = async function () {
  const softwareupdate = spawn('softwareupdate', ['-l'])
  return new Promise((resolve, reject) => {
    softwareupdate.stdout.on('data', (data) => {
      resolve(data.toString())
    })
    softwareupdate.stderr.on('data', (data) => {
      reject(data.toString())
    })
  })
}

const windowsUpdates = async function () {
  const commands = [
    '$updateSession = new-object -com "Microsoft.Update.Session"',
    '$Criteria="IsInstalled=0 and IsHidden=0"',
    '$updates=$updateSession.CreateupdateSearcher().Search($criteria).Updates',
    '$updates | Format-Table -property Title'
  ]
  const updates = await ps.run(commands.join('; '))
  return updates.split(/[\r\n]/g).slice(2)
}

module.exports = async function softwareUpdate (platform) {
  let update = false
  switch (platform) {
    case MAC:
      update = await darwinUpdates()
      break
    case WIN:
      update = await windowsUpdates()
  }
  return update
}
