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

const MINIMUM_AUTOSCAN_INTERVAL_SECONDS = 60 * 5

const PORT = 37370
const HOST = `http://127.0.0.1:${PORT}`

// Application path defaults
const DEFAULT_DARWIN_APP_PATH = '/Applications'
const DEFAULT_WIN32_APP_PATH = '\\Program Files'
const DEFAULT_LINUX_APP_PATH = '/usr/share'

// Application states
const VALID = 'VALID'
const INVALID_INSTALL_STATE = 'INVALID_INSTALL_STATE'
const INVALID_VERSION = 'INVALID_VERSION'

export {
  PASS,
  FAIL,
  NUDGE,
  WARN,
  ALWAYS,
  SUGGESTED,
  NEVER,
  IF_SUPPORTED,
  MINIMUM_AUTOSCAN_INTERVAL_SECONDS,
  ON,
  OFF,
  UNKNOWN,
  UNSUPPORTED,
  PORT,
  HOST,
  DEFAULT_DARWIN_APP_PATH,
  DEFAULT_WIN32_APP_PATH,
  DEFAULT_LINUX_APP_PATH,
  VALID,
  INVALID_INSTALL_STATE,
  INVALID_VERSION
}
