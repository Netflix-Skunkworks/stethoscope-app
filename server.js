const path = require('path')
const fs = require('fs')
const os = require('os')
const extend = require('extend')
const { readFileSync } = fs

const express = require('express')
const { HOST, PORT } = require('./src/constants')
const helmet = require('helmet')
const cors = require('cors')
const bodyParser = require('body-parser')
const fetch = require('isomorphic-fetch')
const yaml = require('js-yaml')
const { compile, run, setKmdEnv } = require('kmd-script/src')
const glob = require('fast-glob')
const { performance } = require('perf_hooks')

const { graphql } = require('graphql')
const { makeExecutableSchema } = require('graphql-tools')
const Resolvers = require('./resolvers/')
const Schema = fs.readFileSync(path.join(__dirname, './schema.graphql'), 'utf8')
const spacesToCamelCase = require('./src/lib/spacesToCamelCase')
const defaultPolicyServer = HOST
const IS_DEV = process.env.STETHOSCOPE_ENV === 'development'

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http, { wsEngine: 'ws' })

setKmdEnv({
  NODE_ENV: process.env.STETHOSCOPE_ENV,
  FILE_BASE_PATH: process.resourcesPath + path.sep
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

  let {
    allowHosts = [],
    hostLabels = [],
    policyServer = defaultPolicyServer
  } = defaultConfig

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

  app.use(['/scan', '/graphql'], cors(corsOptions), async (req, res) => {
    req.setTimeout(60000)

    const key = req.method === 'POST' ? 'body' : 'query'
    const origin = req.get('origin')
    const remote = origin !== 'stethoscope://main'
    let remoteLabel

    // Try to find the host label to display in app ("Last scanned by X")
    if (remote) {
      try {
        const matchHost = ({ pattern }) => (new RegExp(pattern)).test(origin)
        remoteLabel = hostLabels.find(matchHost).name
      } catch (e) {
        remoteLabel = 'Unknown App'
      }
    } else {
      remoteLabel = 'Stethoscope'
    }

    let { query, variables: policy, sessionId = false } = req[key]
    // native notifications are only shown for external requests and
    // are throttled by the users's session id
    let showNotification = sessionId && !alertCache.has(sessionId)
    const start = performance.now()
    // TODO each of these checks should probably be individually executed
    // by relecvant resolvers. Since it is currently super fast, there is no
    // real performance penalty for running all checks on each request
    const checkData = await Promise.all(checks.map(async script => {
      const response = await run(script)
      return response
    }))
    const total = performance.now() - start

    context.kmdResponse = extend(true, {}, ...checkData)

    policy = policy || {}

    if (sessionId && !alertCache.has(sessionId)) {
      alertCache.set(sessionId, true)
    }

    if (typeof policy === 'string') {
      policy = JSON.parse(policy)
    }

    // tell the app if a policy was passed to display scanning status
    if (Object.keys(policy).length) {
      // show the scan is happening in the UI
      io.sockets.emit('scan:init', { remote, remoteLabel })
    }

    graphql(schema, query, null, context, policy).then((result) => {
      const { data = {} } = result
      let scanResult = { noResults: true }

      // update the tray icon if a policy result is in the response
      if (data.policy && data.policy.validate) {
        appActions.setScanStatus(data.policy.validate.status)
        scanResult = { result, remote, remoteLabel, policy, showNotification }
      }

      // inform UI that scan is complete
      io.sockets.emit('scan:complete', scanResult)
      if (!result.extensions) result.extensions = {}
      result.extensions.timing = { total }
      res.json(result)
    }).catch(err => {
      log.error(err.message)
      io.sockets.emit('scan:error')
      res.status(500).json({ error: err.message })
    })
  })

  app.get('/policy', cors(policyRequestOptions), (req, res) => {
    if (!policyServer) {
      const path = find('./practices/policy.yaml')
      const initialPolicy = yaml.safeLoad(fs.readFileSync(path, 'utf8'))
      const policy = spacesToCamelCase(initialPolicy)
      res.json(policy)
    } else {
      fetch(`${policyServer}/policy.yaml`)
        .then(body => body.text())
        .then(yml => yaml.safeLoad(yml, 'utf8'))
        .then(spacesToCamelCase)
        .then(data => res.json(data))
    }
  })

  app.get('/instructions', cors(policyRequestOptions), (req, res) => {
    if (!policyServer) {
      let path = find(`./practices/instructions.${language}.yaml`)
      let instructions
      try {
        instructions = yaml.safeLoad(fs.readFileSync(path, 'utf8'))
      } catch (e) {
        // default to English if system language isn't supported
        path = find(`./practices/instructions.en.yaml`)
        instructions = yaml.safeLoad(fs.readFileSync(path, 'utf8'))
      }
      res.json(instructions)
    } else {
      fetch(`${policyServer}/instructions.yaml`)
        .then(body => body.text())
        .then(yml => yaml.safeLoad(yml, 'utf8'))
        .then(data => res.json(data))
    }
  })

  app.get('/config', cors(policyRequestOptions), (req, res) => {
    if (!policyServer) {
      res.json(defaultConfig)
    } else {
      fetch(`${policyServer}/config.yaml`)
        .then(body => body.text())
        .then(yml => yaml.safeLoad(yml, 'utf8'))
        .then(data => res.json(data))
    }
  })

  // handles all other routes
  app.get('*', (req, res) => res.status(403).end())

  // error handler
  app.use((err, req, res, next) => {
    log.error(err.message)
    res.status(500).send(err.message)
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
