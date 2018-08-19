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
  // setup winston logging
  const transport = new (winston.transports.DailyRotateFile)({
    filename: `${envPrefix}application-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    dirname: path.resolve(userDataPath),
    zippedArchive: true,
    maxSize: '20m',
    maxFiles
  })
  const consoleTransport = new winston.transports.Console()
  log = new winston.Logger({
    rewriters: [(level, msg, meta) => {
      meta.version = pkg.version
      return meta
    }],
    transports: [
      transport,
      consoleTransport
    ]
  })
  global.log = log
}

// make the winston logger available to the renderer
module.exports = log
