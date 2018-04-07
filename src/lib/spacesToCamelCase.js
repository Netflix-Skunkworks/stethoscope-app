const capitalize = require('./capitalize')

module.exports = function spacesToCamelCase (initialPolicy) {
  return Object.keys(initialPolicy).reduce((p, key) => {
    let policyKey = key
    const keyWords = policyKey.toLowerCase().split(' ')
    // converts friendly strings "os version" to camelCase "osVersion"
    if (keyWords.length > 1) {
      policyKey = keyWords.map((x, i) => i > 0 ? capitalize(x) : x).join('')
    }

    // allow mixed case values "Always", "always" -> convert to upper
    const policyVal = typeof initialPolicy[key] === 'string' && /[a-zA-Z]+/.test(initialPolicy[key])
      ? initialPolicy[key].toUpperCase()
      : initialPolicy[key]

    p[policyKey] = policyVal
    return p
  }, {})
}
