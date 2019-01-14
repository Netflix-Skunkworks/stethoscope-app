const simpleTemplate = require('../simple-template')

const template = (templateString) => {
  return function(vars) {
    const data = typeof vars === 'string' ? { input: vars } : vars
    return simpleTemplate(templateString, Object.assign({}, this, data))
  }
}

module.exports = template
