const util = require('util')
const { spawn } = require('child_process')
const os = require('os')
const path = require('path')
const log = require('../src/lib/logger')
const ThriftClient = require('../src/lib/ThriftClient')
const platform = os.platform()

const osqueryPlatforms = {
  darwin: '../bin/osqueryi_darwin',
  win32: '../bin/osqueryi.exe',
  linux: '../bin/osqueryi_linux'
}

const paths = {
  darwin: `/Users/rmcvey/.osquery/shell.em`,
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
    return new Promise((resolve, reject) => {
      if (this.process) {
        this.stop()
        this.process = null
      }

      const osqueryPath = path.resolve(__dirname, osqueryPlatforms[platform])
      const osqueryi = spawn(osqueryPath, ['--nodisable_extensions'], {
        windowsHide: true,
        detached: true,
        shell: true
      })

      setTimeout(() => {
        this.connection = ThriftClient.getInstance({ path: paths[platform] })
        resolve()
      }, 1500)

      osqueryi.stderr.on('data', (data) => {
        log.error(`osquery process stderr: ${data}`);
      });

      osqueryi.on('error', (err) => {
        if (this.connection) {
          this.connection.end()
        }
        log.error(`osquery execution error: ${err}`)
        reject({ message: `Unable to spawn osquery: ${err}` })
      })

      osqueryi.on('close', code => {
        if (this.connection) {
          this.connection.end()
        }
      })

      this.osqueryi = osqueryi
    })
  }

  static stop() {
    if (this.osqueryi) {
      this.osqueryi.kill('SIGKILL')
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

        resolve(result)
      })
    }).catch((err) => {
      log.error('OSQUERY ERROR', err)
    })
  }
}

module.exports = OSQuery
