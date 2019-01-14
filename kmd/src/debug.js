const debug = require('debug')

const customDebug = (prefix) => debug(`kmd:${prefix}`)

module.exports = customDebug
