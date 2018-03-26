// policy result
const PASS = 'PASS'
const FAIL = 'FAIL'
const NUDGE = 'NUDGE'
const WARN = 'WARN'
const UNKNOWN = 'UNKNOWN'
// policy requirements
const ALWAYS = 'ALWAYS'
const SUGGESTED = 'SUGGESTED'
const NEVER = 'NEVER'
const IF_SUPPORTED = 'IF_SUPPORTED'
// device/property state
const ON = 'ON'
const OFF = 'OFF'
const UNSUPPORTED = 'UNSUPPORTED'

const PORT = 37370
const HOST = `http://localhost:${PORT}`

module.exports = {
  PORT, HOST,
  PASS, FAIL, NUDGE, WARN, UNKNOWN,
  ALWAYS, SUGGESTED, NEVER, IF_SUPPORTED,
  ON, OFF, UNSUPPORTED
}
