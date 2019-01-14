const load = require('./load')
module.exports = function (key) {
  const loader = load(key)
  return function(input) {
    const val = loader.call(this)
    console.error(`${key}:`, val)
    return input
  }
}
