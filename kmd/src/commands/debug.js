const print = (prefix) => function(input) {
  if (prefix) console.error("-- "+prefix)
  console.error("  input:", input, "\n  data:", this)
  return input
}

module.exports = print
