const dotProp = require('dot-prop')

const load = (key) => function() {
  return dotProp.get(this, key)
}

module.exports = load
