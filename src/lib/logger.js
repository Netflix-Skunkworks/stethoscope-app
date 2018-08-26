const { app } = require('electron')
const winston = require('winston')
const path = require('path')
require('winston-daily-rotate-file')
const pkg = require('../../package.json')
const IS_DEV = process.env.NODE_ENV === 'development'

let log
let userDataPath = __dirname
let envPrefix = IS_DEV ? 'dev-' : ''
let maxFiles = IS_DEV ? '1d' : '3d'

try {
  userDataPath = app.getPath('userData')
} catch (e) {}

if (!global.log) {
  const appendAppVersion = winston.format(info => {
    info.version = pkg.version
    return info
  })

  log = winston.createLogger({
    format: winston.format.simple(),
    transports: [
      new (winston.transports.DailyRotateFile)({
        filename: `${envPrefix}application-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        dirname: path.resolve(userDataPath),
        zippedArchive: true,
        maxSize: '20m',
        maxFiles
      }),
      new winston.transports.Console()
    ]
  })

  const oldInfo = log.info
  const oldError = log.error

  log.info = function(...args) {
    if (IS_DEV || process.env.STETHOSCOPE_DEBUG) {
      oldInfo(...args)
    }
  }
  log.error = function(...args) {
    if (args[0] instanceof Error) {
      oldError(args[0].message, args[0].stack)
    } else {
      oldError(...args)
    }
  }
  global.log = log

}

// make the winston logger available to the renderer
module.exports = log
