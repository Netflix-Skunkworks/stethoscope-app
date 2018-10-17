/* Error types */

// Exceeded timeout for checking a connection out of the pool
class AcquisitionTimeoutError extends Error {
  constructor(message, metadata = {}) {
    super(`Thrift pool connection acquisition timeout: ${message}`, metadata);
    this.name = 'AcquisitionTimeoutError';
    Error.captureStackTrace(this, AcquisitionTimeoutError);
  }
}

// Exceeded timeout for a single request
class ConnectionTimeoutError extends Error {
  constructor() {
    super('Thrift connection timeout');
    this.name = 'ConnectionTimeoutError';
    Error.captureStackTrace(this, ConnectionTimeoutError);
  }
}

// Connection was closed remotely while in use
class ConnectionClosedError extends Error {
  constructor() {
    super('Thrift connection closed');
    this.name = 'ConnectionClosedError';
    Error.captureStackTrace(this, ConnectionClosedError);
  }
}

module.exports = { AcquisitionTimeoutError, ConnectionTimeoutError, ConnectionClosedError };
