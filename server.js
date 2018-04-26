const express = require('express')
const helmet = require('helmet')
const path = require('path')
const fs = require('fs')
const os = require('os')
const cors = require('cors')
const fetch = require('isomorphic-fetch')
const yaml = require('js-yaml')
const { graphql } = require('graphql')
const bodyParser = require('body-parser')
const { makeExecutableSchema } = require('graphql-tools')
const { graphiqlExpress } = require('graphql-server-express')
const Resolvers = require('./resolvers/')
const OSQuery = require('./sources/osquery')
const { HOST, PORT } = require('./src/constants')
const spacesToCamelCase = require('./src/lib/spacesToCamelCase')
const defaultPolicyServer = HOST
const Schema = fs.readFileSync(path.join(__dirname, './schema.graphql'), 'utf8')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http, { wsEngine: 'ws' })

// used to ensure that user is not shown multiple notifications for a login scan
// sessionId is used as a key
const alertCache = new Map()

module.exports = function startServer (env, log, appActions) {
  const find = filePath => env === 'development' ? filePath : path.join(__dirname, filePath)

  const settingsHandle = fs.readFileSync(find('./practices/config.yaml'), 'utf8')
  const defaultConfig = yaml.safeLoad(settingsHandle)

  app.use(helmet())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  const schema = makeExecutableSchema({
    typeDefs: Schema,
    resolvers: Resolvers
  })

  const {
    allowHosts = [],
    allowRegex = []
  } = defaultConfig

  let { policyServer = defaultPolicyServer } = defaultConfig

  const corsOptions = {
    origin (origin, callback) {
      if (env === 'development') {
        return callback(null, true)
      }

      if (allowHosts.includes(origin)) {
        callback(null, true)
      } else if (allowRegex.length) {
        const isAllowed = allowRegex.some(pattern => {
          const reg = new RegExp(pattern)
          return reg.test(origin)
        })
        callback(isAllowed ? null : new Error(`Unauthorized request from ${origin}`), isAllowed)
      } else {
        callback(new Error(`Unauthorized request from ${origin}`), false)
      }
    },
    methods: 'GET,OPTIONS,HEAD,POST'
  }

  // policy, instructions and config data should only be served to app
  const policyRequestOptions = {
    origin (origin, callback) {
      const allowed = ['http://localhost', 'stethoscope://', 'http://127.0.0.1']
      if (origin && allowed.some(hostname => origin.startsWith(hostname))) {
        callback(null, true)
      } else {
        callback(new Error(`Unauthorized request from ${origin}`), false)
      }
    }
  }

  if (env === 'development') {
    app.use('/graphiql', cors(corsOptions), graphiqlExpress({ endpointURL: '/scan' }))
  }

  app.use(cors(corsOptions), (req, res, next) => {
    if (req.headers['user-agent'].includes('curl/')) {
      log.error('curl request to stethoscope')
    }

    // if a policyServer is present in the URL, set it and refresh app
    // TODO - run check against server and ensure policy files are accessible
    // rollback to defaultPolicyServer if not
    if (req.query.policyServer) {
      policyServer = req.query.policyServer
      io.sockets.emit('rescan', policyServer)

      delete req.query.policyServer
    }
    next()
  })

  // TODO remove raw query for validation and device info??
  app.use(['/scan', '/graphql'], cors(corsOptions), (req, res) => {
    // flush any cached queries from the previous request
    OSQuery.flushCache()

    const context = {
      platform: os.platform(),
      systemInfo: OSQuery.first('system_info'),
      platformInfo: OSQuery.first('platform_info'),
      osVersion: OSQuery.first('os_version')
    }

    const key = req.method === 'POST' ? 'body' : 'query'
    const origin = req.get('origin')
    const remote = origin !== 'stethoscope://main'

    let { query, variables, sessionId = false } = req[key]
    let showNotification = sessionId && !alertCache.has(sessionId)

    if (sessionId && !alertCache.has(sessionId)) {
      alertCache.set(sessionId, true)
    }

    if (typeof variables === 'string') {
      variables = JSON.parse(variables)
    }

    if (variables) {
      // show the scan is happening in the UI
      io.sockets.emit('scan:init', { remote })
    }

    graphql(schema, query, null, context, variables).then((result) => {
      const { data = {} } = result
      const scanResult = data.policy && data.policy.validate

      if (scanResult) {
        let status = data.policy.validate.status
        let upToDate = scanResult.stethoscopeVersion !== 'FAIL'

        appActions.setScanStatus(status)

        if (!upToDate && !origin.startsWith('stethoscope')) {
          // TODO removed to keep similar workflows between Windows and Mac
          // until Windows app is signed
          // appActions.requestUpdate()
        }

        // inform UI that scan is complete
        io.sockets.emit('scan:complete', {
          result,
          remote,
          variables,
          policy: variables,
          showNotification
        })
      } else {
        io.sockets.emit('scan:complete', { noResults: true })
      }

      if (!result.extensions) result.extensions = {}
      result.extensions.timing = OSQuery.getTimingInfo()

      res.json(result)
    }).catch(err => {
      console.log(err)
      log.error(err.message)
      io.sockets.emit('scan:error')
      res.status(500).json({ error: err })
    })
  })

  app.get('/policy', cors(policyRequestOptions), (req, res) => {
    if (!policyServer) {
      const initialPolicy = yaml.safeLoad(fs.readFileSync(find('./practices/policy.yaml'), 'utf8'))
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
      const instructions = yaml.safeLoad(fs.readFileSync(find('./practices/instructions.yaml'), 'utf8'))
      res.json(instructions)
    } else {
      fetch(`${policyServer}/instructions.yaml`)
        .then(body => body.text())
        .then(yml => yaml.safeLoad(yml, 'utf8'))
        .then(data => res.json(data))
    }
  })

  // const defaultConfig = yaml.safeLoad(fs.readFileSync(path.resolve('./practices/config.yaml'), 'utf8'))

  app.get('/config', cors(policyRequestOptions), (req, res) => {
    if (!policyServer) {
      res.json(defaultConfig)
    } else {
      fetch(`${policyServer}/policy.yaml`)
        .then(body => body.text())
        .then(yml => yaml.safeLoad(yml, 'utf8'))
        .then(data => res.json(data))
    }
  })

  // handles all other routes
  app.get('*', (req, res) => {
    res.status(403).end()
  })

  // error handler
  app.use((err, req, res, next) => {
    log.warn(err.message)
    res.status(500).send(err.message)
  })

  // const privateKey = fs.readFileSync('./ssl/stethoscope.key', 'utf8')
  // const certificate = fs.readFileSync('./ssl/stethoscope.crt', 'utf8')
  // const creds = { key: privateKey, cert: certificate }
  // const httpsServer = https.createServer(creds, app)
  const serverInstance = http.listen(PORT, 'localhost', () => {
    console.log(`local server listening on ${PORT}`)
  })

  return serverInstance
}
