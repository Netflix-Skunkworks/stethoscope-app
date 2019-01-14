const fecha = require('fecha')
const parseDate = (format) => (str) => str && fecha.parse(str, format)
module.exports = parseDate
