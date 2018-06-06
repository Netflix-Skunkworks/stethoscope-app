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

  constructor(opts = { path: '/Users/' + process.env.USER + '/.osquery/shell.em'}) {
    const path = opts.path || '/Users/' + process.env.USER + '/.osquery/shell.em'
    const conn = thrift.createConnection(0, path)
    this._em = thrift.createClient(ExtensionManager, conn)
    this._socketPath = path
    this._conn = conn
  }

  query (sql, cb) {
    this._em.query(sql, cb)
  }

  end() {
    this._conn.end()
    this._conn.destroy()
  }
}

module.exports = ThriftClient
