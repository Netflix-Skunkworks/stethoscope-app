const debug = require('../debug')('pipe')

const pipe = (...fns) => {
  return async (input) => {
    let data = {}
    let lastResult = input
    for (const fn of fns) {
      // debug("calling", fn)
      lastResult = await fn.call(data, lastResult)
      debug("  intermediate result:", lastResult)
      debug("  intermediate data", data)
    }
    return Object.keys(data).length === 0 ? lastResult : data
  }
}

module.exports = pipe
