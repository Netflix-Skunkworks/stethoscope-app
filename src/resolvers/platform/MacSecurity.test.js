import MacSecurity from './MacSecurity'
import { DEFAULT_DARWIN_APP_PATH } from '../../constants'
import kmd from '../../lib/kmd'

jest.mock('../../lib/kmd')

afterEach(() => {
  kmd.mockReset()
})

describe('MacOS applications resolver', () => {
  it('should pass name and path to kmd', async () => {
    const name = 'Super Cool App'
    const path = 'super/cool/app'
    await MacSecurity.applications(
      null,
      [
        {
          name,
          paths: {
            darwin: path
          },
          platform: {
            darwin: ">=10.12.0"
          }
        }
      ],
      {}
    )
    expect(kmd.mock.calls[0][2]).toEqual({ NAME: name, PATH: path })
  })

  it('should set a default path when not present', async () => {
    const name = 'Super Cool App'
    await MacSecurity.applications(
      null,
      [
        {
          name,
          platform: {
            darwin: ">=10.12.0"
          }
        }
      ],
      {}
    )
    expect(kmd.mock.calls[0][2]).toEqual({ NAME: name, PATH: DEFAULT_DARWIN_APP_PATH })
  })
})
