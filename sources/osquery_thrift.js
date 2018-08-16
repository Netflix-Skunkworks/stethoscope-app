const util = require('util')
const { app } = require('electron')
const { spawn, exec } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const log = require('../src/lib/logger')
const ThriftClient = require('../src/lib/ThriftClient')
const platform = os.platform()
const IS_DEV = process.env.NODE_ENV === 'development'

const OSQUERY_PID_PATH = `${app.getPath('home')}${path.sep}.osquery.pid`

const osqueryPlatforms = {
  darwin: 'osqueryd_darwin',
  win32: 'osqueryd.exe',
  linux: 'osqueryi_linux'
}

const socketPath = {
  darwin: `/tmp/osquery.em`,
  win32: `\\\\.\\pipe\\osquery.em`
}

const defaultOptions = {
  fields: ['*'],
  where: '1 = 1'
}

const cache = new Map()
const timers = new Map()

class OSQuery {
  static getTimingInfo () {
    let timerValues = [...timers.values()]
    let queries = [...timers.entries()]

    this.clearTimers()

    return {
      total: timerValues.reduce((p, v) => p + v, 0),
      queries
    }
  }

  static start() {
    this.stop()

    const socket = socketPath[platform]
    const binary = `../bin/${osqueryPlatforms[platform]}`
    const prefix = IS_DEV ? '' : '..' + path.sep
    const osqueryPath = path.resolve(
      __dirname,
      prefix + binary
    )

    const osquerydArgs = [
      '--ephemeral',
      '--disable_database',
      '--disable_events=true',
      '--disable_logging',
      '--force',
      '--config_path=null',
      '--allow_unsafe',
      '--verbose', // required to detect when thrift socket is ready
    ]

    if (platform === 'darwin') {
      osquerydArgs.push(`--extensions_socket=${socket}`)
    }

    const spawnArgs = {
      shell: true,
      windowsHide: true
    }

    let startAttempts = 0
    const MAX_ATTEMPTS = 20
    const launchCommand = `"${osqueryPath}"`

    IS_DEV && log.info(`osquery:initialize: ${launchCommand}`)

    return new Promise((resolve, reject) => {
      const osqueryd = spawn(launchCommand, osquerydArgs, spawnArgs)

      IS_DEV && log.info(`writing pid ${osqueryd.pid} to ${OSQUERY_PID_PATH}`)
      fs.writeFile(OSQUERY_PID_PATH, osqueryd.pid)

      osqueryd.on('error', (err) => {
        if (this.connection) {
          this.connection.end()
        }
        log.error(`osquery:execution error: ${err}`)
        reject(new Error(`Unable to spawn osqueryd: ${err}`))
      })

      IS_DEV && osqueryd.on('disconnect', () => log.info('osqueryd disconnected'))

      osqueryd.on('close', code => {
        IS_DEV && log.info('osqueryd closed')
        if (this.connection) {
          this.connection.end()
        }
      })

      osqueryd.stderr.on('data', function(data) {
        IS_DEV && log.info('osquery:stderr', data+'')
        /*
         TODO - flagged for future improvement
         unfortunately this seems to be the only way to determine that the socket
         server is ready to accept connections
        */
        if (process.platform === 'darwin') {
          if (data.includes('Extension manager service starting')) {
            IS_DEV && log.info('osquery:Thrift socket ready')
            resolve(osqueryd)
          }
        } else if (process.platform === 'win32') {
          /*
          Let it be noted that I'm super unhappy with this magic number approach.
          I've spent way too much time trying to get the Mac solution working on
          Windows and have determined that it all comes down to timing. It works
          sometimes but is extremely unpredictable and boils down to whether or
          not the "Extension manager" messages comes in on the very first stderr
          write because for a reason I seem to be unable to determine, the output
          is disconnected after the first read. I've tried many things, piping to stdout,
          draining, forcing another write, looking at encoding issues, spawning
          the process in just about every configuration imaginable and am going
          to shelve it for now because it never takes osquery more than one
          second to load and this solution is reliable enough for the time being.
          */
          setTimeout(() => resolve(), 200)
        }
      })

      this.osqueryd = osqueryd

      // thrift retry logic - keep attempting to connect to extension manager
      const tryReconnect = err => {
        startAttempts++
        IS_DEV && log.error(`osquery:thrift unable to connect to socket ${err} | attempt: ${startAttempts}`)

        if (startAttempts >= MAX_ATTEMPTS) {
          log.error('TOO MANY ATTEMPTS to connect to osquery')
          reject(new Error(err))
        } else {
          setTimeout(() => {
            this.connection.connect()
            this.connection.on('error', tryReconnect)
          }, 100)
        }
      }

      this.connection = ThriftClient.getInstance({ path: socket })
      this.connection.connect()
      this.connection.on('error', tryReconnect)

      if (IS_DEV) {
        ['message', 'data', 'exit'].map(evt =>
          osqueryd.on(evt, data => log.info(`osquery:${evt}`, data + ''))
        )
      }
    })
  }

  static stop() {
    try {
      const pid = fs.readFileSync(OSQUERY_PID_PATH)
      if (pid) {
        log.warn('found old osquery pid', pid+'')
        try {
          process.kill(parseInt(pid+'', 10))
        } catch (e) {
          log.error('Unable to kill process', pid+'')
        }

        try {
          fs.unlinkSync(OSQUERY_PID_PATH)
        } catch (err) {
          log.error('cannot unlink pidfile', err)
        }
      }
    } catch (e) {
      log.warn('expected error reading pidfile', e.message)
    }
  }

  static flushCache () {
    cache.clear()
  }

  static clearTimers () {
    timers.clear()
  }
  /**
   * Fetch first result from a schema
   * @param  {String} schema                   schema name (e.g. 'platform_info')
   * @param  {Object} [options=defaultOptions] query options { fields: [field1, field2], where: 'my where clause' }
   * @return {Promise}                         resolves with JSON query result, rejects with stderr
   */
  static first (schema, options = defaultOptions) {
    return this.all(schema, options)
      .then((data) => {
        return Object(Array.isArray(data) ? data[0] : data)
      })
  }

  /**
   * Fetch all results from a schema
   * @param  {String} schema                   schema name (e.g. 'disk_encryption')
   * @param  {Object} [options=defaultOptions] query options { fields: [field1, field2], where: 'my where clause' }
   * @return {Promise}                         resolves with JSON query result, rejects with stderr
   */
  static all (schema, options = defaultOptions) {
    return this.exec(`select ${options.fields.join(', ')} from ${schema} where ${options.where || '1==1'};`)
  }

  /**
   * Executes a raw osquery query
   * @param  {String|Array} queries  Query(ies) to run
   * @return {Promise}
   */
  static exec (query) {
    return new Promise((resolve, reject) => {
      if (cache.has(query)) {
        return resolve(cache.get(query))
      }

      IS_DEV && log.info('osquery:query', query)

      let start = process.hrtime()

      this.connection.query(query, (error, { response: result }) => {
        if (error) return reject(error)
        cache.set(query, result)
        // timing data
        const [s, n] = process.hrtime(start)
        const nanoseconds = (s * 1e9 + n)
        const milliseconds = nanoseconds * 1e-6
        const end = Math.floor(milliseconds * 100) / 100
        timers.set(query, end)

        IS_DEV && log.info('osquery:result', result)

        resolve(result)
      })
    }).catch((err) => {
      log.error('OSQUERY ERROR', err)
    })
  }
}

module.exports = OSQuery
