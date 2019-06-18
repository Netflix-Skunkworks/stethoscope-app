/**
 * Used in dev - polls for create-react-app HMR server readyness,
 * triggers `yarn electron` once react is ready
 */
const net = require('net')
const { spawn } = require('child_process')

const PORT = process.env.PORT
let port = 12000
if (PORT) { port = PORT - 100 }

process.env.ELECTRON_START_URL = `http://127.0.0.1:${port}`

const client = new net.Socket()

let startedElectron = false
const tryConnection = () => {
  client.connect({ port }, () => {
    client.end()
    if (!startedElectron) {
      console.log(`yarn react:start - react ready on http://127.0.0.1:${port}`)
      console.log('yarn electron:start')
      startedElectron = true
      let cmd = 'yarn'
      if (process.platform === 'win32') {
        cmd = 'yarn.cmd'
      }
      const appServer = spawn(cmd, ['dev:electron'], {
        cwd: __dirname
      })
      appServer.stdout.on('data', data => console.log(data.toString()))
      appServer.stderr.on('data', data => console.error(data.toString()))
      appServer.on('error', (err) => console.log('FAILED TO SPAWN', err))
    }
  })
}

tryConnection()

client.on('error', () => {
  setTimeout(tryConnection, 1000)
})
