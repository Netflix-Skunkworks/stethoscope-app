import WindowsSecurity from './WindowsSecurity'
import { DEFAULT_WIN32_APP_REGISTRY_PATH } from '../../constants'
import kmd from '../../lib/kmd'

jest.mock('../../lib/kmd')

afterEach(() => {
  kmd.mockReset()
})

describe('Windows applications resolver', () => {
  it('should pass (registry) path to kmd', async () => {
    const name = 'fooApp'
    const path = 'some\\nonstandard\\regpath'

    kmd.mockResolvedValue({
      apps: [
        {name: 'fooApp', version: '1.2.3'}
      ]
    })

    await WindowsSecurity.applications(
      null,
      [
        {
          name,
          paths: {
            win32: path
          },
          platform: {
            win32: ">=10.0"
          }
        }
      ],
      {}
    )
    expect(kmd.mock.calls[0][2]).toEqual({ REGISTRY_PATH: path })
  })

  it('should set a default path when not present', async () => {
    const name = 'fooApp'

    kmd.mockResolvedValue({
      apps: [
        {name: 'fooApp', version: '1.2.3'}
      ]
    })

    await WindowsSecurity.applications(
      null,
      [
        {
          name,
          platform: {
            win32: ">=10.0"
          }
        }
      ],
      {}
    )
    expect(kmd.mock.calls[0][2]).toEqual({ REGISTRY_PATH: DEFAULT_WIN32_APP_REGISTRY_PATH })
 })

  it('specifies reason when not installed', async () => {
    const name = 'fooApp'

    kmd.mockResolvedValue({
      apps: [
        {name: 'barSuite', version: '10.0.3'}
      ]
    })

    const result = await WindowsSecurity.applications(
      null,
      [
        {
          name,
          platform: {
            win32: ">=10.0"
          }
        }
      ],
      {}
    )

    expect(result[0].reason).toEqual("NOT_INSTALLED")
 })

  it('specifies reason when out of date', async () => {
    const name = 'fooApp'

    kmd.mockResolvedValue({
      apps: [
        {name: 'fooApp', version: '1.0.0'}
      ]
    })

    const result = await WindowsSecurity.applications(
      null,
      [
        {
          name,
          version: ">=2.0.0",
          platform: {
            win32: ">=10.0"
          }
        }
      ],
      {}
    )

    expect(result[0].reason).toEqual("OUT_OF_DATE")
 })
})
