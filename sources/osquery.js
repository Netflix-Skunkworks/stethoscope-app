const { execFile } = require('child_process')
const os = require('os')
const path = require('path')
const platform = os.platform()

const osqueryPlatforms = {
  darwin: '../bin/osqueryi_darwin',
  win32: '../bin/osqueryi.exe',
  linux: '../bin/osqueryi_linux'
}

const defaultOptions = {
  fields: ['*'],
  where: '1 = 1'
}

const cache = new Map()
const timers = new Map()

module.exports = class OSQuery {
  static getTimingInfo () {
    let timerValues = [...timers.values()]
    let queries = [...timers.entries()]

    this.clearTimers()

    return {
      total: timerValues.reduce((p, v) => p + v, 0),
      queries
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
  static exec (queries) {
    return new Promise((resolve, reject) => {
      const commands = Array.isArray(queries) ? queries : [queries]
      const key = commands.join('')
      const osqueryPath = path.resolve(__dirname, osqueryPlatforms[platform])

      if (cache.has(key)) {
        return resolve(cache.get(key))
      }

      let start = process.hrtime()

      execFile(osqueryPath, ['--json', commands], (error, stdout, stderr) => {
        if (error) return reject(error)
        if (stderr) return reject(new Error(stderr))

        const result = JSON.parse(stdout)
        cache.set(key, result)
        // timing data
        const [s, n] = process.hrtime(start)
        const nanoseconds = (s * 1e9 + n)
        const milliseconds = nanoseconds * 1e-6
        const end = Math.floor(milliseconds * 100) / 100
        timers.set(key, end)

        resolve(result)
      })
    }).catch((err) => {
      console.error('OSQUERY ERROR', err)
    })
  }
}
