const thrift = require('thrift')
const ExtensionManager = require('./thrift/ExtensionManager.js')
const thriftPoolClient = require('./thrift/Pool')

class ThriftClient {
  static getInstance (opts) {
    if (!this.instance) {
      this.instance = new ThriftClient(opts)
    }
    return this.instance
  }

  constructor (opts = { path: '' }) {
    this.path = opts.path
    this.port = 0
  }

  connect () {
    const transport = thrift.TBufferedTransport
    const protocol = thrift.TBinaryProtocol
    this._client = thriftPoolClient(ExtensionManager, {
      host: this.port,
      port: this.path,
      transport,
      protocol
    }, {
      poolOptions: {
        max: 5
      }
    })

    return this
  }

  query (msg, cb) {
    this._client.query(msg)
      .then(res => cb(null, res))
      .catch(err => cb(err, null))
  }
}

module.exports = ThriftClient
