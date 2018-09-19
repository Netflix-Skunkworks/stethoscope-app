// policy result
const PASS = 'PASS'
const FAIL = 'FAIL'
const NUDGE = 'NUDGE'
const WARN = 'WARN'
// policy requirements
const ALWAYS = 'ALWAYS'
const SUGGESTED = 'SUGGESTED'
const NEVER = 'NEVER'
const IF_SUPPORTED = 'IF_SUPPORTED'
// device/property state
const ON = 'ON'
const OFF = 'OFF'
const UNKNOWN = 'UNKNOWN'
const UNSUPPORTED = 'UNSUPPORTED'

const PORT = 37370
const HOST = `http://127.0.0.1:${PORT}`

module.exports = {
  PASS,
  FAIL,
  NUDGE,
  WARN,

  ALWAYS,
  SUGGESTED,
  NEVER,
  IF_SUPPORTED,

  ON,
  OFF,
  UNKNOWN,
  UNSUPPORTED,

  PORT,
  HOST
}
