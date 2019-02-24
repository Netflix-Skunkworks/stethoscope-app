const { GraphQLScalarType } = require('graphql')
const semver = require('../src/lib/patchedSemver')

const Semver = new GraphQLScalarType({
  name: 'Semver',
  description: 'Semver formatted string',
  serialize (value) {
    if (semver.valid(semver.coerce(value))) {
      return value
    }
    throw new Error(`${value} is not a valid Semver string`)
  },
  parseValue (value) {
    if (semver.valid(semver.coerce(value))) {
      return value
    }
    throw new Error(`${value} is not a valid Semver string`)
  },
  parseLiteral (ast) {
    if (semver.valid(semver.coerce(ast.value))) {
      return ast.value
    }
    throw new Error(`${ast.value} is not a valid Semver string`)
  }
})

module.exports = Semver
