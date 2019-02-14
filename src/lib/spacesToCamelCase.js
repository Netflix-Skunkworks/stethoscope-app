/*
spacesToCamelCase continues to exist for backwards compat of previously
supported yaml format (e.g. "os version" instead of "osVersion")
 */
function capitalize (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

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
