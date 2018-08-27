const path = require('path')
const fs = require('fs')
const os = require('os')

const express = require('express')
const { HOST, PORT } = require('./src/constants')
const helmet = require('helmet')
const cors = require('cors')
const bodyParser = require('body-parser')
const fetch = require('isomorphic-fetch')
const yaml = require('js-yaml')
const semver = require('semver')

const { graphql } = require('graphql')
const { makeExecutableSchema } = require('graphql-tools')
const Resolvers = require('./resolvers/')
const Schema = fs.readFileSync(path.join(__dirname, './schema.graphql'), 'utf8')
const spacesToCamelCase = require('./src/lib/spacesToCamelCase')
const powershell = require('./src/lib/powershell')
const defaultPolicyServer = HOST

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http, { wsEngine: 'ws' })

// used to ensure that user is not shown multiple notifications for a login scan
// sessionId is used as a key
const alertCache = new Map()

module.exports = function startServer (env, log, language, appActions, OSQuery) {
  log.info('starting express server')
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

  let {
    allowHosts = [],
    hostLabels = [],
    policyServer = defaultPolicyServer
  } = defaultConfig

  const corsOptions = {
    origin (origin, callback) {
      if (env === 'development') return callback(null, true)
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

  if (env === 'development') {
    const { graphiqlExpress } = require('graphql-server-express')
    app.use('/graphiql', cors(corsOptions), graphiqlExpress({ endpointURL: '/scan' }))
  }

  app.use(['/scan', '/graphql'], cors(corsOptions), (req, res) => {
    req.setTimeout(60000)
    // flush any cached queries from the previous request
    OSQuery.flushCache()
    powershell.flushCache()

    const context = {
      platform: process.platform || os.platform(),
      systemInfo: OSQuery.first('system_info'),
      platformInfo: OSQuery.first('platform_info'),
      osVersion: OSQuery.first('os_version').then(v => {
        let version = [v.major, v.minor]
        if (process.platform === 'win32') {
          version.push(v.build)
        } else {
          version.push(v.patch)
        }
        v.version = semver.coerce(version.join('.'))
        log.info('Version', v.version+'', 'Joined', version.join('.'), 'Coerced', semver.coerce(version.join('.'))+'')
        return v
      })
    }

    const key = req.method === 'POST' ? 'body' : 'query'
    const remote = req.get('origin') !== 'stethoscope://main'
    let remoteLabel

    if (remote) {
      try {
        remoteLabel = hostLabels
          .find(({ pattern }) =>
            (new RegExp(pattern)).test(req.get('origin'))
          ).name
      } catch (e) {
        remoteLabel = 'Unknown App'
      }
    } else {
      remoteLabel = 'Stethoscope'
    }

    let { query, variables: policy, sessionId = false } = req[key]
    let showNotification = sessionId && !alertCache.has(sessionId)

    if (sessionId && !alertCache.has(sessionId)) {
      alertCache.set(sessionId, true)
    }

    if (typeof policy === 'string') {
      policy = JSON.parse(policy)
      // show the scan is happening in the UI
      io.sockets.emit('scan:init', { remote, remoteLabel })
    }

    graphql(schema, query, null, context, policy).then((result) => {
      const { data = {} } = result
      let scanResult = { noResults: true }

      if (data.policy && data.policy.validate) {
        appActions.setScanStatus(data.policy.validate.status)
        scanResult = { result, remote, remoteLabel, policy, showNotification }
      }

      // inform UI that scan is complete
      io.sockets.emit('scan:complete', scanResult)

      if (!result.extensions) result.extensions = {}
      result.extensions.timing = OSQuery.getTimingInfo()

      if (os.platform() === 'win32') {
        const { total, queries } = powershell.getTimingInfo()
        log.info(total, queries)
        result.extensions.timing.total += total
        result.extensions.timing.queries.push(...queries)
      }

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

  // const privateKey = fs.readFileSync('./ssl/stethoscope.key', 'utf8')
  // const certificate = fs.readFileSync('./ssl/stethoscope.crt', 'utf8')
  // const creds = { key: privateKey, cert: certificate }
  // const httpsServer = https.createServer(creds, app)
  const serverInstance = http.listen(PORT, 'localhost', () => {
    console.log(`local server listening on ${PORT}`)
    serverInstance.emit('server:ready')
  })

  return serverInstance
}
