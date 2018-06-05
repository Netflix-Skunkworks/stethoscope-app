const { app } = require('electron')
const winston = require('winston')
const path = require('path')
require('winston-daily-rotate-file')
const pkg = require('../../package.json')

let log

if (!global.log) {
  // setup winston logging
  const transport = new (winston.transports.DailyRotateFile)({
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    dirname: path.resolve(app.getPath('userData')),
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '3d'
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
