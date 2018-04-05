const semver = require('semver')
const Security = require('./Security')
const {
  PASS, FAIL, NUDGE,
  ALWAYS, SUGGESTED, IF_SUPPORTED, NEVER
} = require('../src/constants')

const Policy = {

  async validate (root, args, context) {
    const { policy } = Object.assign({}, args)
    const response = {}

    for (const verification in policy) {
      // get policy requirement for current property
      const requirement = policy[verification]
      // determine device state
      const passing = await Security[verification](root, policy, context)

      // this handles multiplicable items like applications, etc.
      if (Array.isArray(passing)) {
        // convert verification result to PASS|FAIL
        response[verification] = passing.map(({ name, passing }) => {
          return {
            name,
            status: passing ? PASS : FAIL
          }
        })
      } else {
        // default item to PASS
        response[verification] = PASS

        if (passing === false) {
          // test failure against policy requirement
          switch (requirement) {
            // passing is suggested, NUDGE user
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
        if (passing && requirement === NEVER) {
          response[verification] = FAIL
        }

        if (passing === NUDGE) {
          response[verification] = NUDGE
        }
      }

      // set the global validation status based on the individual policy evaluation results
      const values = Object.values(response)
      const deviceResults = new Set(values)

      // need to also add any multiplicable statuses (e.g. applications)
      values.forEach(val => {
        if (Array.isArray(val)) {
          val.forEach(({ status }) => {
            deviceResults.add(status)
          })
        }
      })

      if (deviceResults.has(FAIL)) {
        response.status = FAIL
      } else if (deviceResults.has(NUDGE)) {
        response.status = NUDGE
      } else {
        response.status = PASS
      }
    }

    return response
  }
}

module.exports = Policy
