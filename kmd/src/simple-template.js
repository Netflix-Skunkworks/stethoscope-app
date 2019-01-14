const dotProp = require('dot-prop')

const render = (template, data) => {
  return template.replace(
    /\{([^}]*)\}/g, // or /{(\w*)}/g for "{this} instead of %this%"
    function( m, key ){
      const val = dotProp.get(data, key)
      return val || ""
    }
  )
}

module.exports = render

if (require.main === module) {
  console.log(render('Hi {name}!', { name: 'Fred' }))
  console.log(render('Hi {name.first}!', { name: { first: 'Fred' }}))
}
