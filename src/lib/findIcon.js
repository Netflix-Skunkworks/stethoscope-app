const path = require('path')

module.exports = env => file => {
  const basePath = env === 'development' ? '../../public' : '../../build'
  return path.join(__dirname, basePath, file)
}
