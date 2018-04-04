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
              // we only want the global status to be switched to NUDGE if it
              // is currently PASS, it should not override a global status FAIL
              if (response.status === PASS) {
                response.status = NUDGE
              }
              break

            // passing is only required if platform supports
            case IF_SUPPORTED:
            // failure is required
            case NEVER:
              break

            // handles ALWAYS and semver requirement failures
            default:
              response[verification] = FAIL
              response.status = FAIL
              break
          }
        }

        // passing tests are only a FAIL if the policy forbids it (e.g. remote login enabled)
        if (passing === true && requirement === NEVER) {
          response[verification] = FAIL
          response.status = FAIL
        }
      }
    }

    return response
  }
}

module.exports = Policy
