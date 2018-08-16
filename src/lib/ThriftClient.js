const thrift = require('thrift')
const ExtensionManager = require('./thrift/ExtensionManager.js')
const Types = require('./thrift/osquery_types.js')

class ThriftClient {
  static getInstance(opts) {
    if (!this.instance) {
      this.instance = new ThriftClient(opts)
    }
    return this.instance
  }

  constructor(opts = { path: '' }) {
    this.path = opts.path
    this.port = 0
  }

  connect() {
    this._connection = thrift.createConnection(this.port, this.path)
    this._client = thrift.createClient(ExtensionManager, this._connection)
  }

  on(event, callback) {
    this._connection.on(event, callback)
  }

  off(event, callback) {
    this._connection.removeListener(event, callback)
  }

  query (msg, cb) {
    this._client.query(msg, cb)
  }

  end() {
    this._connection.end()
    this._connection.destroy()
  }
}

module.exports = ThriftClient
