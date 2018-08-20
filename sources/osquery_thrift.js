const { app } = require('electron')
const { spawn } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const log = require('../src/lib/logger')
const ThriftClient = require('../src/lib/ThriftClient')
const platform = os.platform()
const Sudoer = require('electron-sudo').default
const IS_DEV = process.env.NODE_ENV === 'development'
const OSQUERY_PID_PATH = `${app.getPath('userData')}${path.sep}.osquery.pid`

const osqueryBinaries = {
  darwin: 'osqueryd_darwin',
  win32: 'osqueryd.exe',
  linux: 'osqueryd_linux',
  ubuntu: 'osqueryd_linux'
}

const socketPaths = {
  darwin: `/tmp/osquery.em`,
  ubuntu: `/tmp/osquery.em`,
  linux: `/tmp/osquery.em`,
  win32: `\\\\.\\pipe\\osquery.em`
}

const defaultOptions = {
  fields: ['*'],
  where: '1 = 1'
}

const debug = (...args) => {
  IS_DEV && log.info(`oquery: ${args.join(' ')}`)
}

const cache = new Map()
const timers = new Map()

class OSQuery {
  static __endThriftConnection () {
    debug('osqueryd closed')
    if (this.connection) {
      this.connection.end()
    }
  }
  /**
   * Returns timing info about executed queries
   * @return {Object} total time (in ms), array of individual queries with time
   */
  static getTimingInfo () {
    let timerValues = [...timers.values()]
    let queries = [...timers.entries()]

    this.clearTimers()

    return {
      total: timerValues.reduce((p, v) => p + v, 0),
      queries
    }
  }

  /**
   * Start osqueryd process, create thrift connection
   * @return {Promise} resolve when connected, reject if unable
   */
  static start () {
    this.stop()

    const socket = socketPaths[platform]
    // resolve path differences between dev and production
    const binary = `../bin/${osqueryBinaries[platform]}`
    const prefix = IS_DEV ? '' : '..' + path.sep
    const osqueryPath = path.resolve(__dirname, prefix + binary)

    const osquerydArgs = [
      '--ephemeral',
      '--disable_database',
      '--disable_events=true',
      '--disable_logging',
      '--force',
      '--config_path=null',
      '--allow_unsafe'
    ]

    // *nix based OS seem less opposed to custom socket paths
    if (platform !== 'win32') {
      osquerydArgs.push(`--extensions_socket=${socket}`)
    }

    const spawnArgs = {
      shell: true,
      windowsHide: true
    }

    const launchCommand = `"${osqueryPath}"`

    debug(`initialize: ${launchCommand} ${osquerydArgs.join(' ')}`)

    return new Promise((resolve, reject) => {
      this.osqueryd = spawn(launchCommand, osquerydArgs, spawnArgs)

      fs.writeFile(OSQUERY_PID_PATH, this.osqueryd.pid, (err) => {
        if (err) log.error(`Unable to write osquery pidfile: ${OSQUERY_PID_PATH}`)
      })

      this.osqueryd.on('error', (err) => {
        if (this.connection) this.__endThriftConnection()
        log.error(`osquery:execution error: ${err}`)
        reject(new Error(`Unable to spawn osqueryd: ${err}`))
      })

      this.osqueryd.on('close', this.__endThriftConnection)

      let startAttempts = 0
      let thriftConnectTimeout
      const MAX_ATTEMPTS = 20

      const resolveOnThriftConnect = () => {
        clearTimeout(thriftConnectTimeout)
        resolve()
      }
      /**
      * Internal method that attempts to connect to thrift socket and
      * incrementally backoff
      */
      const tryThriftReconnect = err => {
        startAttempts++

        debug(`thrift unable to connect to socket ${err} | attempt: ${startAttempts}`)

        if (startAttempts >= MAX_ATTEMPTS) {
          log.error('THRIFT unable to connect to osquery')
          reject(new Error(err))
        } else {
          const incrementalBackoff = 100 * startAttempts
          thriftConnectTimeout = setTimeout(() => {
            // remove old event listeners and add new
            this.connection
              .connect()
              .off('connect', resolveOnThriftConnect)
              .off('error', tryThriftReconnect)
              .on('connect', resolveOnThriftConnect)
              .on('error', tryThriftReconnect)
          }, incrementalBackoff)
        }
      }

      // attempt to connect thrift client
      this.connection = ThriftClient.getInstance({ path: socket })
        .connect()
        .on('connect', resolveOnThriftConnect)
        .on('error', tryThriftReconnect)
    })
  }

  /**
   * Kill the process identified by pidfile written at launch
   */
  static stop () {
    try {
      const pid = fs.readFileSync(OSQUERY_PID_PATH)
      if (pid) {
        debug(`found old osquery pid ${pid}`)
        try {
          process.kill(parseInt(pid + '', 10))
        } catch (e) {
          log.error('Unable to kill process', pid + '')
        }

        try {
          fs.unlinkSync(OSQUERY_PID_PATH)
        } catch (err) {
          log.error('cannot unlink pidfile', err)
        }
      }
    } catch (e) {
      debug(`expected error reading pidfile ${e.message}`)
    }
  }

  /**
   * Clear in-memory cache of query results, currently run by express server
   * before new scans
   */
  static flushCache () {
    cache.clear()
  }

  /**
   * Clear in-memory query time data, currently run by express server
   * before new scans
   */
  static clearTimers () {
    timers.clear()
  }

  /**
   * [rawQuery description]
   * @param  {String} query osquery SQL
   * @return {Object|Array} osquery response as Array or Object
   */
  static rawQuery (query) {
    return this.exec(query)
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

      let start = process.hrtime()

      this.connection.query(query, (error, { response: result }) => {
        if (error) return reject(error)
        // in-memory cache of query => result
        cache.set(query, result)
        // timing data
        const [s, n] = process.hrtime(start)
        const nanoseconds = (s * 1e9 + n)
        const milliseconds = nanoseconds * 1e-6
        const queryTime = Math.floor(milliseconds * 100) / 100
        timers.set(query, queryTime)

        debug('query', JSON.stringify({
          query,
          result,
          time: queryTime + 'ms'
        }, null, 3))

        resolve(result)
      })
    }).catch((err) => {
      log.error('OSQUERY ERROR', err)
    })
  }
}

module.exports = OSQuery
