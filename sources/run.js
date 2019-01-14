const execa = require('execa')
const parse = require('shell-quote').parse

const run = async (shellStr, opts={}) => {
  const shellCmd = parse(shellStr)
  const [cmd, ...args] = shellCmd
  const {stdout} = await execa(cmd, args)
  const output = {}
  if (opts) {
    if (opts.map) {
      for (const key of Object.keys(opts.map)) {
        const mapStrategy = opts.map[key]
        if (mapStrategy.regex) {
          const m = stdout.match(mapStrategy.regex)
          if (m) output[key] = m[mapStrategy.matchNum]
        }
      }
    }
    return JSON.stringify(output)
  } else {
    return stdout
  }
}

run('ioreg -d2 -c IOPlatformExpertDevice', {
  map: {
    uuid: {
      regex: /"IOPlatformUUID" = "([^""]+)"/,
      matchNum: 1
    },
    serial: {
      regex: /"IOPlatformSerialNumber" = "([^""]+)"/,
      matchNum: 1
    },
  }
}).then(console.log)
