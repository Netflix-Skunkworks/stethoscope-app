const { app } = require('electron')
const { spawn, exec } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const log = require('../src/lib/logger')
const ThriftClient = require('../src/lib/ThriftClient')
const platform = os.platform()
const { NODE_ENV, STETHOSCOPE_DEBUG } = process.env
const IS_DEV = NODE_ENV === 'development'
const OSQUERY_PID_PATH = `${app.getPath('userData')}${path.sep}osquery.pid`

const osqueryBinaries = {
  darwin: 'osqueryd_darwin',
  win32: 'osqueryd.exe',
  linux: 'osqueryd_linux',
  ubuntu: 'osqueryd_linux'
}

const socketPaths = {
  darwin: `${app.getPath('userData')}/osquery.em`,
  ubuntu: `/tmp/osquery.em`,
  linux: `/tmp/osquery.em`,
  win32: `\\\\.\\pipe\\osquery.em`
}

const defaultOptions = {
  fields: ['*'],
  where: '1 = 1'
}

const debug = (...args) => STETHOSCOPE_DEBUG && STETHOSCOPE_DEBUG.includes('osquery') && log.info(`oquery: ${args.join(' ')}`)

const CACHE_TIMEOUT = 1000
let clearCacheTimeout

const cache = new Map()
const timers = new Map()

class OSQuery {
  static __endThriftConnection () {
    debug('osqueryd closed')
    if (this.connection && 'end' in this.connection) {
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
  static async start () {
    log.info('Stopping previously running osquery instances')
    await this.stop()

    const socket = socketPaths[platform]
    // resolve path differences between dev and production
    const binary = `../bin/${osqueryBinaries[platform]}`
    const prefix = IS_DEV ? '' : '..' + path.sep
    const osqueryPath = path.resolve(__dirname, prefix + binary)

    const osquerydArgs = [
      '--ephemeral',
      '--disable_database',
      '--disable_events=true',
      '--force=true',
      '--disable_logging',
      `--pidfile="${OSQUERY_PID_PATH}"`,
      '--force',
      '--config_path=null',
      '--allow_unsafe'
    ]

    // *nix based OS seem less opposed to custom socket paths
    if (platform !== 'win32') {
      osquerydArgs.push(`--extensions_socket='${socket}'`)
    }

    const spawnArgs = {
      shell: true,
      windowsHide: true
    }

    const launchCommand = `"${osqueryPath}"`

    debug(`initialize: ${launchCommand} ${osquerydArgs.join(' ')}`)

    return new Promise(async (resolve, reject) => {
      this.osqueryd = spawn(launchCommand, osquerydArgs, spawnArgs)
      this.osqueryd.stderr.on('data', debug)
      this.osqueryd.stdin.on('data', debug)

      this.osqueryd.on('error', (err) => {
        if (this.connection) this.__endThriftConnection()
        log.error(`osquery:execution error: ${err}`)
        reject(new Error(`Unable to spawn osqueryd: ${err}`))
      })

      this.osqueryd.on('close', this.__endThriftConnection)

      // attempt to connect thrift client
      this.connection = await this.openThriftConnection(socket)

      resolve()
    })
  }

  static openThriftConnection (socket) {
    return new Promise((resolve, reject) => {
      let connection;

      let interval = setInterval(()=>{
        if (fs.existsSync(socket)) {
          clearInterval(interval)
          log.info(`Socket path exists, opening Thrift Client to: ${socket}`);
          connection = ThriftClient.getInstance({ path: socket }).connect()
          resolve(connection)
        } else {
          log.debug("Socket path does not yet exist, waiting before checking again!")
        }
      }, 100)
    })
  }

  /**
   * Kill the process identified by pidfile written at launch
   */
  static stop () {
    return Promise.resolve(true)
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
    clearTimeout(clearCacheTimeout)

    return new Promise((resolve, reject) => {
      if (cache.has(query)) {
        timers.set(query, 0)
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

        clearCacheTimeout = setTimeout(() => {
          this.flushCache()
        }, CACHE_TIMEOUT)

        resolve(result)
      })
    }).catch((err) => {
      log.error('OSQUERY ERROR', err)
      reject(err)
    })
  }
}

module.exports = OSQuery
