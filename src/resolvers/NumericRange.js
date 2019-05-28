import { GraphQLScalarType } from 'graphql'
import semver from '../lib/patchedSemver'

// NumericRange is an alias for the Semver scalar type
export default new GraphQLScalarType({
  name: 'NumericRange',
  description: 'Number or formatted number range string',
  serialize (value) {
    if (semver.valid(semver.coerce(value))) {
      return value
    }
    throw new Error(`${value} is not a valid NumericRange string`)
  },
  parseValue (value) {
    if (semver.valid(semver.coerce(value))) {
      return value
    }
    throw new Error(`${value} is not a valid NumericRange string`)
  },
  parseLiteral (ast) {
    if (semver.valid(semver.coerce(ast.value))) {
      return ast.value
    }
    throw new Error(`${ast.value} is not a valid NumericRange string`)
  }
})
