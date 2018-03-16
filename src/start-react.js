const net = require('net')
const { spawn } = require('child_process')
const os = require('os')

const port = process.env.PORT ? process.env.PORT - 100 : 12000

process.env.ELECTRON_START_URL = `http://localhost:${port}`

const client = new net.Socket()

let startedElectron = false
const tryConnection = () => {
  client.connect({ port }, () => {
    client.end()
    if (!startedElectron) {
      console.log('starting electron')
      startedElectron = true
      const cmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm'
      const appServer = spawn(cmd, ['run', 'electron'], {
        cwd: __dirname,
      })
      appServer.stdout.on('data', data => console.log(data.toString()))
      appServer.stderr.on('data', data => console.error(data.toString()))
      appServer.on('error', (err) => console.log("FAILED TO SPAWN", err))
    }
  })
}

tryConnection()

client.on('error', () => {
  setTimeout(tryConnection, 1000)
})
