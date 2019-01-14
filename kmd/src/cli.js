const fs = require('fs-extra')
const { runScript } = require('./index')
const extend = require('extend')

const args = process.argv.slice(2)

const files = args
Promise.all(files.map(f => {
  return fs.readFile(f, 'utf8')
    .then(script => runScript(script))
    .catch(console.error)
})).then(results => {
  if (results.length === 1) return results[0]
  return extend(true, {}, ...results)
}).then(obj => console.log(JSON.stringify(obj)))
