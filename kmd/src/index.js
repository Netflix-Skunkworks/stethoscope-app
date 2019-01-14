const debug = require('./debug')('run')
const fs = require('fs-extra')
const vm = require('vm')
const commands = require('./commands/index')
const indentationParser = require('./indentation')

const makeLine = (line, lineNum) => {
  const [cmd, ...args] = line.trim().split(/\s+/)
  let singleArg = args.join(' ')
  if (!commands[cmd]) {
    throw new Error(`command ${cmd} is not supported`)
  }
  if (cmd !== 'extract') {
    try {
      // unescape the strings
      singleArg = JSON.parse(`"${singleArg}"`)
    } catch (e) {
      debug('Error parsing singleArg', singleArg)
    }
  }
  return commands[cmd](singleArg)
}

const makeBlock = (lines, { map }={}) => {
  const realLines = lines.filter(line => typeof line !== 'string' || !line.match(/^\s*#/))
  const fns = realLines.map(line => typeof line === 'string' ? makeLine(line) : makeBlock(line, { map: true }))
  if (map) {
    return commands.map(commands.pipe(...fns))
  } else {
    return commands.pipe(...fns)
  }
}

const compile = (scriptSrc) => {
  // console.time('compile')
  const lines = indentationParser(scriptSrc.trim().split('\n').filter(line => line.trim().length > 0))
  pipeline = makeBlock(lines)
  // console.timeEnd('compile')
  return pipeline
}

const run = async (fn, input) => {
  // console.time('run')
  const result = await fn(input)
  // console.timeEnd('run')
  return result
}

const runScript = (scriptSrc) => run(compile(scriptSrc))

module.exports = {
  compile,
  run,
  runScript,
  commands
}
