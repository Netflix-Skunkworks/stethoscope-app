import { compile, setKmdEnv, run } from 'kmd-script/src'
import { graphiqlExpress } from 'graphql-server-express'
import { graphql } from 'graphql'
import { makeExecutableSchema } from 'graphql-tools'
import { performance } from 'perf_hooks'
import { PORT } from './constants'
import kmd from './lib/kmd'
import { Server } from 'http'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import extend from 'extend'
import { readFileSync } from 'fs'
import glob from 'fast-glob'
import helmet from 'helmet'
import path from 'path'
import pkg from '../package.json'
import Resolvers from './resolvers/'
import socketio from 'socket.io'
import spacesToCamelCase from './lib/spacesToCamelCase'
import yaml from 'js-yaml'

const Schema = readFileSync(path.join(__dirname, '../schema.graphql'), 'utf8')
const IS_DEV = process.env.STETHOSCOPE_ENV === 'development'
const app = express()
const server = new Server(app)
const io = socketio(server, { wsEngine: 'ws' })

function matchHost (origin) {
  return label => {
    return new RegExp(label.pattern).test(origin)
  }
}

setKmdEnv({
  NODE_ENV: process.env.STETHOSCOPE_ENV,
  FILE_BASE_PATH: process.resourcesPath + path.sep,
  NODE_PATH: process.execPath
})

function precompile () {
  const searchPath = path.resolve(__dirname, `./sources/${process.platform}/*.sh`)
  return glob(searchPath)
    .then(files =>
      files.map(file =>
        compile(readFileSync(file, 'utf8'))
      )
    )
}

// used to ensure that user is not shown multiple notifications for a login scan
// sessionId is used as a key
const alertCache = new Map()

export default async function startServer (env, log, language = 'en-US', appActions) {
  log.info('starting express server')
  const checks = await precompile()
  const find = filePath => path.join(__dirname, filePath)
  const settingsHandle = readFileSync(find('./practices/config.yaml'), 'utf8')
  const defaultConfig = yaml.safeLoad(settingsHandle)

  app.use(helmet())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  const schema = makeExecutableSchema({
    resolvers: Resolvers,
    typeDefs: Schema
  })

  const { allowHosts = [], hostLabels = [] } = defaultConfig

  // wide open in dev, limited to hosts specified in './practices/config.yaml' in production
  const corsOptions = {
    origin (origin, callback) {
      if (IS_DEV) { return callback(null, true) }
      if (allowHosts.includes(origin)) { return callback(null, true) }
      if (hostLabels.length) {
        const isAllowed = hostLabels
          .map(({ pattern }) => new RegExp(pattern))
          .some(regex => regex.test(origin))

        if (isAllowed) {
          return callback(null)
        }
      }

      log.error(`Unauthorized request from ${origin}`)
      callback(new Error(`Unauthorized request from ${origin}`), false)
    },
    methods: 'GET,OPTIONS,HEAD,POST'
  }

  // policy, instructions and config data should only be served to app
  const policyRequestOptions = {
    origin (origin, callback) {
      const allowed = ['http://localhost:', 'stethoscope://', 'http://127.0.0.1:']
      if (origin && allowed.some(hostname => origin.startsWith(hostname))) {
        callback(null, true)
      } else {
        log.error(`Unauthorized request from ${origin}`)
        callback(new Error(`Unauthorized request from ${origin}`), false)
      }
    }
  }

  if (IS_DEV) {
    app.use('/graphiql', cors(corsOptions), graphiqlExpress({ endpointURL: '/scan' }))
  }

  app.get('/debugger', cors(corsOptions), async (req, res) => {
    let promise = Promise.resolve()

    if (req.get('host') !== '127.0.0.1:37370') {
      promise = appActions.requestLogPermission(req.get('origin'))
      appActions.enableDebugger()
    }

    promise.then(async () => {
      const file = readFileSync(log.getLogFile())
      const promises = Object.entries(checks).map(async ([name, script]) => {
        try { return await run(script) } catch (e) { return '' }
      })
      const checkData = await Promise.all(promises)
      // format response
      const sep = `\n${'='.repeat(20)}\n`
      const noColor = String(file).replace(/\[[\d]+m?:?/g, '') + '\n'
      const str = JSON.stringify(extend(true, {}, ...checkData), null, 3)
      const version = `Stethoscope version: ${pkg.version}`
      res.send(`${version}\nLOGS${sep}${noColor}DEVICE DATA${sep}${str}`)
    }).catch(() => {
      res.status(403).send('ACCESS DENIED')
    })
  })

  app.get('/raw', cors(corsOptions), async (req, res) => {
    const promises = Object.entries(checks).map(async ([name, script]) => {
      try { return await run(script) } catch (e) { return '' }
    })
    const checkData = await Promise.all(promises)
    res.json(extend(true, {}, ...checkData))
  })

  app.use(['/scan', '/graphql'], cors(corsOptions), async (req, res) => {
    // set upper boundary on scan time (45 seconds)
    req.setTimeout(45000, () => {
      log.error('Request timed out')
    })

    // allow GET/POST requests and determine what property to use
    const key = req.method === 'POST' ? 'body' : 'query'
    const origin = req.get('origin')
    const isRemote = origin !== 'stethoscope://main'
    let remoteLabel = 'Stethoscope'

    // Try to find the host label to display in app ("Last scanned by X")
    if (isRemote) {
      const match = matchHost(origin)
      const label = hostLabels.find(match)
      if (label) {
        remoteLabel = label.name
      }
    }

    const { query, sessionId = false } = req[key]
    let { variables: policy } = req[key]
    // native notifications are only shown for external requests and
    // are throttled by the users's session id
    const showNotification = sessionId && !alertCache.has(sessionId)
    const start = performance.now()
    const context = {}
    const device = await kmd('os', context)

    // AWS workspace override
    if (device.system.platform.includes('Server 2016 Datacenter')) {
      device.system.platform = 'awsWorkspace'
    }
    // throttle native push notifications to user by session id
    if (sessionId && !alertCache.has(sessionId)) {
      alertCache.set(sessionId, true)
    }

    // policy needs to be an object, regardless of whether or not one was
    // supplied in the request, parse if String was supplied
    if (typeof policy === 'string') {
      policy = JSON.parse(policy)
    } else {
      policy = Object.assign({}, policy)
    }

    // if a policy was passed, tell the UI a scan has started
    if (Object.keys(policy).length) {
      io.sockets.emit('scan:init', { remote: isRemote, remoteLabel })
    }

    graphql(schema, query, null, context, policy).then(result => {
      const total = performance.now() - start
      const { data = {}, errors } = result
      let scanResult = { noResults: true }

      if (errors && !isRemote) {
        const errMessage = errors.reduce((p, c) => p + c + '\n', '')
        io.sockets.emit('scan:error', { error: errMessage })
        throw new Error(errMessage)
      }

      // update the tray icon if a policy result is in the response
      if (data.policy && data.policy.validate) {
        appActions.setScanStatus(data.policy.validate.status)
        scanResult = { result, remote: isRemote, remoteLabel, policy, showNotification }
      }

      // inform UI that scan is complete
      io.sockets.emit('scan:complete', scanResult)
      if (!result.extensions) { result.extensions = {} }
      result.extensions.timing = { total }
      res.json(result)
    }).catch(err => {
      io.sockets.emit('scan:error', { error: err.message })
      throw err
    })
  })

  app.get('/config', serveConfig('config'))
  app.get('/policy', serveConfig('policy', { transform: spacesToCamelCase }))
  // default to English if system language isn't supported
  app.get('/instructions', serveConfig(`instructions.${language}`, {
    fallback: `instructions.en`
  }))

  // serves up YAML files
  function serveConfig (filename, options) {
    let fallback = false
    let transform = x => x
    if (options) {
      if (options.fallback) { fallback = options.fallback }
      if (options.transform) { transform = options.transform }
    }

    const getFilePath = name => find(`./practices/${name}.yaml`)

    return [
      cors(policyRequestOptions),
      (req, res) => {
        const filePath = getFilePath(filename)
        try {
          const response = yaml.safeLoad(readFileSync(filePath, 'utf8'))
          res.json(transform(response))
        } catch (e) {
          log.error(`Failed to load and transform ${filePath}`)
          if (fallback && typeof fallback === 'string') {
            const response = yaml.safeLoad(readFileSync(getFilePath(fallback), 'utf8'))
            res.json(transform(response))
          }
        }
      }
    ]
  }

  // handles all other routes
  app.get('*', (_, res) => res.status(403).end())

  // error handler
  app.use((err, req, res, next) => {
    res.status(500).format({
      'application/json': () => {
        res.send({ error: err.message })
      },
      'default': () => {
        res.send(err.message)
      }
    })
    log.error(`server: ${err.message}`)
  })

  const serverInstance = server.listen(PORT, '127.0.0.1', () => {
    console.log(`GraphQL server listening on ${PORT}`)
    if (IS_DEV) {
      console.log(`Explore the schema: http://127.0.0.1:${PORT}/graphiql`)
    }
    serverInstance.emit('server:ready')
  })

  return serverInstance
}

process.on('unhandledRejection', reason => {
  console.log('unhandledRejection', reason.message, reason.reason, reason.stack)
})
