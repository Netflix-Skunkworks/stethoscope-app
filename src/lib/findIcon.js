const path = require('path')

const findIcon = env => file => {
  const basePath = env === 'development' ? '../../public' : '../../build'
  return path.join(__dirname, basePath, file)
}

module.exports = findIcon

if (require.main === module) {
  const curPath = path.resolve(path.dirname('../../'))
  console.assert(findIcon('development')('foo') === curPath+'/app/public/foo', 'dev path is not correct')
  console.log('dev ✓')
  console.assert(findIcon('production')('foo') === curPath+'/app/build/foo', 'prod path is not correct')
  console.log('prod ✓')
  console.log(__filename, 'tests passed')
}
