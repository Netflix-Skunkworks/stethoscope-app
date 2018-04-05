const semver = require('semver')
const Security = require('./Security')
const {
  PASS, FAIL, NUDGE, UNKNOWN, UNSUPPORTED,
  ALWAYS, SUGGESTED, IF_SUPPORTED, NEVER
} = require('../src/constants')

const isObject = o => Object(o) === o
const isBool = b => typeof b === 'boolean'

const Policy = {

  async validate (root, args, context) {
    const { policy } = args

    let response = Object.assign({ status: PASS }, policy)

    for (let verification in policy) {
      // get policy requirement for current property
      let requirement = policy[verification]
      // determine device state
      const passing = await Security[verification](root, policy, context)

      // this handles multiplicable items like applications, etc.
      if (Array.isArray(passing)) {
        response[verification] = []

        for (let i = 0; i < passing.length; i++) {
          response[verification][i] = {
            name: passing[i].name,
            status: passing[i].passing ? PASS : FAIL
          }

          if (!passing[i].passing) {
            response.status = FAIL
          }
        }
      } else {
        // default item to PASS
        response[verification] = PASS

        if (passing === false) {
          // test failure against policy requirement
          switch (requirement) {
            // passing is not required
            case SUGGESTED:
              response[verification] = NUDGE
              break

            // passing is only required if platform supports
            case IF_SUPPORTED:
            // failure is required
            case NEVER:
              break

            // handles ALWAYS and some semver requirement failures
            default:
              response[verification] = FAIL
              break
          }
        }

        // passing tests are only a FAIL if the policy forbids it (e.g. remote login enabled)
        if (passing === true && requirement === NEVER) {
          response[verification] = FAIL
        }

        if (passing === NUDGE) {
          response[verification] = NUDGE
        }
      }

      // set the global validation status
      const uniqueResults = new Set(Object.values(response))
      if (uniqueResults.has(FAIL)) {
        response.status = FAIL
      } else if (uniqueResults.has(NUDGE)) {
        response.status = NUDGE
      } else {
        response.status = PASS
      }
    }

    return response
  }
}

module.exports = Policy
