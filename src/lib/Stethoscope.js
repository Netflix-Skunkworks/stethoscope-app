const { ON, OFF, NEVER, ALWAYS, UNSUPPORTED, IF_SUPPORTED, HOST } = require('../constants')

const handleValidate = (policy, result, partitions, device, practices, platform) => {
  const { security = {} } = Object(device)

  return Object.keys(policy).reduce((acc, key) => {
    const item = {
      title: key,
      name: key,
      status: security[key],
      actions: '',
      link: '',
      ...practices[key],
      directions: practices[key].directions[platform]
    }

    if (security[key] === ON) {
      switch (policy[key]) {
        case NEVER:
          acc.critical.push(item)
          break
        default:
          acc.done.push(item)
      }
    } else if (security[key] === UNSUPPORTED) {
      switch (policy[key]) {
        case IF_SUPPORTED:
          acc.done.push(item)
          break
        default:
          acc.critical.push(item)
      }
    } else if (security[key] === OFF) {
      switch (policy[key]) {
        case ALWAYS:
          acc.critical.push(item)
          break
        case NEVER:
          acc.done.push(item)
          break
        default:
          acc.suggested.push(item)
      }
    }
    return acc
  }, partitions)
}

const handleValidateWithDetails = (result, partitions, device, practices, platform) => {
  const { status, ...rest } = result
  const nonNullValues = Object.keys(rest).filter(key => result[key])

  return nonNullValues.reduce((acc, key) => {
    let itemStatus = rest[key]
    // some policy results are enumerable, reduce them to PASS/FAIL
    if (Array.isArray(itemStatus)) {
      itemStatus = itemStatus.every(item => item.status === 'PASS') ? 'PASS' : 'FAIL'
    }

    const item = {
      title: key,
      name: key,
      status: itemStatus,
      actions: '',
      link: '',
      ...practices[key],
      directions: practices[key].directions[platform]
    }

    if (Array.isArray(rest[key])) {
      item.results = rest[key]
    }

    switch (itemStatus) {
      case 'PASS':
        acc.done.push(item)
        break
      case 'FAIL':
        acc.critical.push(item)
        break
      default:
        acc.suggested.push(item)
    }

    return acc
  }, partitions)
}

export default class Stethoscope {
  static partitionSecurityInfo (policy, result, device, practices, platform) {
    const partitions = {
      critical: [],
      suggested: [],
      done: [],
    }

    if (Object.keys(result).length === 1 && result.status) {
      return handleValidate(policy, result, partitions, device, practices, platform)
    } else {
      return handleValidateWithDetails(result, partitions, device, practices, platform)
    }
  }

  // privately retry request until a response is given
  static __repeatRequest(policy, resolve, reject) {
    // TODO create and use fragments here
    const query = `query ValidateDevice($policy: DevicePolicyV2!) {
      policy {
        validateV2(policy: $policy) {
          status
          osVersion
          firewall
          diskEncryption
          screenLock
          automaticUpdates
          remoteLogin
          requiredApplications {
            name
            status
          }
          bannedApplications {
            name
            status
          }
        }
      }
      device {
        deviceId
        deviceName
        platform
        platformName
        osVersion
        firmwareVersion
        hardwareModel
        friendlyName
        hardwareSerial
        stethoscopeVersion
        osqueryVersion
        ipAddresses {
          interface
          address
          mask
          broadcast
        }
        macAddresses {
          interface
          type
          mac
          lastChange
        }
        security {
          firewall
          automaticUpdates
          diskEncryption
          screenLock
          remoteLogin
        }
      }
    }`

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { policy }}),
    }

    fetch(`${HOST}/scan`, options)
      .then(res => {
        switch (res.status) {
          case 200:
            return res.json()
          case 204:
            throw new Error('retry')
          default:
            return res
        }
      })
      .then(({ data }) => {
        const result = data.policy.validateV2
        const { device } = data
        resolve({ result, device })
      })
      .catch((err) => {
        if (err.message === 'retry') {
          return this.__repeatRequest(policy, resolve, reject)
        } else {
          reject(err.message)
        }
      })
  }

  // public API
  static validate(policy) {
    return new Promise((resolve, reject) => {
      this.__repeatRequest(policy, resolve, reject)
    })
  }
}
