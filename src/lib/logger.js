import { app } from 'electron'
import winston from 'winston'
import path from 'path'
import moment from 'moment'
import chalk from 'chalk'
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
const logColors = ['red', 'yellow', 'cyan', 'magenta']
// logs that will continue to output in prod
// change if you want more than 'error' and 'warn'
const productionLogs = logLevels.slice(0, 2)

if (!global.log) {
  const filename = `${envPrefix}application-%DATE%.log`
  log = winston.createLogger({
    format: winston.format.simple(),
    transports: [
      new (winston.transports.DailyRotateFile)({
        filename,
        datePattern: 'YYYY-MM-DD',
        dirname: path.resolve(userDataPath),
        zippedArchive: true,
        maxSize: '20m',
        maxFiles
      })
    ]
  })

  log.getLogFile = function () {
    return path.join(
      path.resolve(userDataPath),
      filename.replace('%DATE%', moment().format('YYYY-MM-DD'))
    )
  }

  // support multiple arguments to winston logger
  const wrapper = (original, level) => {
    return (...args) => original(args.map(o => {
      let color = false
      let transform = s => s

      if (IS_DEV) {
        let index = logLevels.indexOf(level)
        if (index > -1) {
          color = logColors[index]
          transform = s => chalk[color](s)
        }
      }
      if (typeof o === 'string') return transform(o)
      return transform(JSON.stringify(o, null, 2))
    }).join(' '))
  }

  // log all levels in DEV, to default file logger AND console
  if (IS_DEV) {
    logLevels.forEach(level => {
      log[level] = wrapper(log[level], level)
    })
    log.add(new winston.transports.Console({
      format: winston.format.simple()
    }))
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
export default log
