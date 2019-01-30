/* global it, expect, describe */
import chai from 'chai'
import chaiHttp from 'chai-http'
import { MAC, WIN } from '../lib/platform'
import startGraphQLServer from '../../server'

process.env.NODE_ENV = 'test'

let server = startGraphQLServer('test', {
  log (...args) { console.log(args) },
  error (...args) { console.error(args) }
}, {
  setScanStatus (foo) {}
})

chai.use(chaiHttp)

describe('GraphQL', () => {
  it('Should query device info', () => {
    chai.request(server)
      .get('/scan')
      .set('Origin', 'stethoscope://main')
      .query({ query: `
        {
          device {
            platform
          }
        }
      ` })
      .end((err, res) => {
        if (err) {
          throw err
        }
        expect(JSON.parse(res.text).data).toEqual({
          device: {
            platform: process.platform
          }
        })
      })
  })

  it(`Should fail when CORS origin is not authorized`, () => {
    chai.request(server)
      .get('/scan')
      .set('Origin', 'http://foobar.malicious.biz')
      .query({ query: `
        {
          device {
            platform
          }
        }
      ` })
      .end((err, res) => {
        if (err) {
          throw err
        }
        expect(res.text).toEqual(`Unauthorized request from http://foobar.malicious.biz`)
      })
  })

  it('Should perform a full scan', () => {
    const query = `query ValidateDevice($policy: DevicePolicy!) {
      policy {
        validate(policy: $policy) {
          status
          osVersion
          firewall
          diskEncryption
          screenLock
          automaticUpdates
          remoteLogin
          stethoscopeVersion

          requiredApplications {
            name
            status
          }

          bannedApplications {
            name
            status
          }

          suggestedApplications {
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

        disks {
          label
          name
          encrypted
        }

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
          physicalAdapter
        }

        security {
          firewall
          publicFirewall
          privateFirewall
          domainFirewall
          automaticUpdates
          diskEncryption
          screenLock
          remoteLogin
          automaticAppUpdates
          automaticSecurityUpdates
          automaticOsUpdates
          automaticDownloadUpdates
          automaticConfigDataInstall
        }
      }
    }`

    const variables = JSON.stringify({
      'policy': {
        'stethoscopeVersion': '>=1.0.4',
        'osVersion': {
          [MAC]: {
            'ok': '>=10.13.4',
            'nudge': '>=10.12.6'
          },
          [WIN]: {
            'ok': '>=10.0.16299',
            'nudge': '>=10.0.15063'
          }
        },
        'firewall': 'ALWAYS',
        'diskEncryption': 'ALWAYS',
        'automaticUpdates': 'SUGGESTED',
        'screenLock': 'IF_SUPPORTED',
        'remoteLogin': 'NEVER'
      }
    })

    chai.request(server)
      .get('/scan')
      .set('Origin', 'stethoscope://main')
      .query({ query, variables })
      .then((res) => {
        const response = JSON.parse(res.text)
        expect(response.data.policy.validate.status).toEqual('PASS')
      })
      .catch((err) => {
        console.error(err)
        throw err
      })
  })

  it('Should fail with errors when key name case is incorrect', () => {
    chai.request(server)
      .get('/scan')
      .set('Origin', 'stethoscope://main')
      .query({ query: `
        {
          device {
            friendly_name
          }
        }
      ` })
      .end((err, res) => {
        if (err) {
          throw err
        }
        const response = JSON.parse(res.text)
        expect(response.errors.length).toBeGreaterThan(0)
      })
  })
})
