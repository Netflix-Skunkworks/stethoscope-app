module.exports = (key) => function() {
  delete this[key]
}
