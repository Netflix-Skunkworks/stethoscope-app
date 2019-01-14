const fs = require('fs-extra')
// TODO use exec instead, which might delegate to shell.js?
const cat = () => (filename) => {
  return fs.readFile(filename, 'utf8').catch(err => console.error('error reading file:', err))
}

module.exports = cat
