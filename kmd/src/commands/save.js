const dotProp = require('dot-prop')

const save = (key) => {
  // need this function syntax to get the right this binding
  return function(value) {
    if (!value) return
    dotProp.set(this, key, value)
    return value
  }
}

module.exports = save
