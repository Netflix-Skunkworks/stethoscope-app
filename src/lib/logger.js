/**
 * Global Logger, pipes appropriate logs to file in dev and production incl.
 * auto-rotation.
 *
 *   // visible in dev
 *   log.info('foo', true, { hello: 'world' })
 *   // visible in dev and prod
 *   log.error(new Error("ohnos"))
 */
const { app } = require('electron')
const winston = require('winston')
const path = require('path')
require('winston-daily-rotate-file')
const IS_DEV = process.env.STETHOSCOPE_ENV === 'development'

let log
// log path is %USERDATA%/Stethoscope/application-log-{YYYY-MM-DD}.log
let userDataPath = __dirname
try {
  userDataPath = app.getPath('userData')
} catch (e) {}

// DEV log file names are prefixed with dev-
let envPrefix = IS_DEV ? 'dev-' : ''
let maxFiles = IS_DEV ? '1d' : '3d'
const logLevels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly']
// logs that will continue to output in prod
// change if you want more than 'error' and 'warn'
const productionLogs = logLevels.slice(0, 2)



if (!global.log) {
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
      })
    ]
  })

  // support multiple arguments to winston logger
  const wrapper = ( original ) => {
    return (...args) => original(args.map(o => {
      if (typeof o === 'string') return o
      return JSON.stringify(o, null, 2)
    }).join(' '))
  }

  // log all levels in DEV, to default file logger AND console
  if (IS_DEV) {
    logLevels.forEach(level =>
      log[level] = wrapper(log[level])
    )
    log.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
  } else {
    // only error/warn should be logged in prod
    logLevels.forEach(level => {
      if (productionLogs.includes(level)) {
        log[level] = wrapper(log[level])
      } else {
        log[level] = () => {}
      }
    })
  }

  global.log = log
}

// make the winston logger available to the renderer
module.exports = log
