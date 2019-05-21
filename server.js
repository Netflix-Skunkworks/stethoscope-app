const path = require('path')
const fs = require('fs')
const os = require('os')
const extend = require('extend')
const { readFileSync } = fs

const express = require('express')
const { PORT } = require('./src/constants')
const helmet = require('helmet')
const cors = require('cors')
const bodyParser = require('body-parser')
const yaml = require('js-yaml')
const { compile, run, setKmdEnv } = require('kmd-script/src')
const glob = require('fast-glob')
const pkg = require('./package.json')
const { performance } = require('perf_hooks')

const { graphql } = require('graphql')
const { makeExecutableSchema } = require('graphql-tools')
const Resolvers = require('./resolvers/')
const Schema = fs.readFileSync(path.join(__dirname, './schema.graphql'), 'utf8')
const spacesToCamelCase = require('./src/lib/spacesToCamelCase')
const IS_DEV = process.env.STETHOSCOPE_ENV === 'development'

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http, { wsEngine: 'ws' })

setKmdEnv({
  NODE_ENV: process.env.STETHOSCOPE_ENV,
  FILE_BASE_PATH: process.resourcesPath + path.sep,
  NODE_PATH: process.execPath
})

function precompile () {
  const searchPath = path.resolve(__dirname, `./sources/${process.platform}/*.sh`)
  return glob(searchPath)
    .then(files =>
      files.map(file => compile(readFileSync(file, 'utf8')))
    )
}

// used to ensure that user is not shown multiple notifications for a login scan
// sessionId is used as a key
const alertCache = new Map()

module.exports = async function startServer (env, log, language = 'en-US', appActions) {
  log.info('starting express server')
  const checks = await precompile()
  const find = filePath => IS_DEV ? filePath : path.join(__dirname, filePath)

  const settingsHandle = fs.readFileSync(find('./practices/config.yaml'), 'utf8')
  const defaultConfig = yaml.safeLoad(settingsHandle)

  app.use(helmet())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  const schema = makeExecutableSchema({
    typeDefs: Schema,
    resolvers: Resolvers
  })

  let { allowHosts = [], hostLabels = [] } = defaultConfig

  // wide open in dev, limited to hosts specified in './practices/config.yaml' in production
  const corsOptions = {
    origin (origin, callback) {
      if (IS_DEV) return callback(null, true)
      if (allowHosts.includes(origin)) return callback(null, true)
      if (hostLabels.length) {
        const isAllowed = hostLabels
          .map(({ pattern }) => new RegExp(pattern))
          .some(regex => regex.test(origin))

        return callback(isAllowed ? null : new Error(`Unauthorized request from ${origin}`), isAllowed)
      }
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
        callback(new Error(`Unauthorized request from ${origin}`), false)
      }
    }
  }

  if (IS_DEV) {
    const { graphiqlExpress } = require('graphql-server-express')
    app.use('/graphiql', cors(corsOptions), graphiqlExpress({ endpointURL: '/scan' }))
  }

  // this doesn't change per request, capture it prior to scan
  const context = {
    platform: process.platform || os.platform()
  }

  app.get('/debugger', cors(corsOptions), (req, res) => {
    let promise = Promise.resolve()

    if (req.get('host') !== '127.0.0.1:37370') {
      promise = appActions.requestLogPermission(req.get('origin'))
      appActions.enableDebugger()
    }

    promise.then(async () => {
      const file = fs.readFileSync(log.getLogFile())
      const checkData = await Promise.all(checks.map(async script => {
        try { return await run(script) } catch (e) { return '' }
      }))
      const noColor = String(file).replace(/\[[\d]+m?:?/g, '')
      const out = `Stethoscope version: ${pkg.version}
LOGS
==============================
${noColor}
DEVICE DATA
==============================
${JSON.stringify(extend(true, {}, ...checkData), null, 3)}`

      res.send(out)
    }).catch(() => {
      res.status(403).send('ACCESS DENIED')
    })
  })

  app.use(['/scan', '/graphql'], cors(corsOptions), async (req, res) => {
    // set upper boundary on scan time (45 seconds)
    req.setTimeout(45000)

    // allow GET/POST requests and determine what property to use
    const key = req.method === 'POST' ? 'body' : 'query'
    const origin = req.get('origin')
    const isRemote = origin !== 'stethoscope://main'
    let remoteLabel = 'Stethoscope'

    // Try to find the host label to display in app ("Last scanned by X")
    if (isRemote) {
      const matchHost = ({ pattern }) => (new RegExp(pattern)).test(origin)
      const label = hostLabels.find(matchHost)
      if (label) {
        remoteLabel = label.name
      }
    }

    let { query, variables: policy, sessionId = false } = req[key]
    // native notifications are only shown for external requests and
    // are throttled by the users's session id
    let showNotification = sessionId && !alertCache.has(sessionId)
    const start = performance.now()
    // TODO each of these checks should be individually executed
    // by relecvant resolvers. Since it is currently super fast, there is no
    // real performance penalty for running all checks on each request
    // this would require loading the script files differently so the resolvers
    // could execute the appropriate pre-compiled scripts
    const checkData = await Promise.all(checks.map(async script => {
      try { return await run(script) } catch (e) { return '' }
    }))
    // perf data
    const total = performance.now() - start
    context.kmdResponse = extend(true, {}, ...checkData)
    // AWS workspace override
    if (context.kmdResponse.system.platform.includes('Server 2016 Datacenter')) {
      context.kmdResponse.system.platform = 'awsWorkspace'
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
      if (!result.extensions) result.extensions = {}
      result.extensions.timing = { total }
      res.json(result)
    }).catch(err => {
      io.sockets.emit('scan:error', { error: err.message })
      throw err
    })
  })

  app.get('/config', serveConfig('config'))
  app.get('/policy', serveConfig('policy', false, spacesToCamelCase))
  // default to English if system language isn't supported
  app.get('/instructions', serveConfig(`instructions.${language}`, `instructions.en`))

  // serves up YAML files
  function serveConfig (filename, fallbackPath = false, transform = d => d) {
    return [ cors(policyRequestOptions), (req, res) => {
      const path = find(`./practices/${filename}.yaml`)
      try {
        const response = yaml.safeLoad(fs.readFileSync(path, 'utf8'))
        res.json(transform(response))
      } catch (e) {
        if (fallbackPath) {
          const response = yaml.safeLoad(fs.readFileSync(path, 'utf8'))
          res.json(transform(response))
        }
      }
    } ]
  }

  // handles all other routes
  app.get('*', (_, res) => res.status(403).end())

  // error handler
  app.use((err, req, res, next) => {
    res.status(500).format({
      'text/plain': () => {
        res.send(err.message)
      },
      'text/html': () => {
        res.send(`<p>Error: ${err.message}</p>`)
      },
      'application/json': () => {
        res.send({ error: err.message })
      },
      'default': () => {
        // log the request and respond with 406
        res.status(406).send('Not Acceptable')
      }
    })
    log.error(`server: ${err.message}`)
  })

  const serverInstance = http.listen(PORT, '127.0.0.1', () => {
    console.log(`GraphQL server listening on ${PORT}`)
    IS_DEV && console.log(`Explore the schema: http://127.0.0.1:${PORT}/graphiql`)
    serverInstance.emit('server:ready')
  })

  return serverInstance
}

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error.message, error.reason, error.stack)
})
