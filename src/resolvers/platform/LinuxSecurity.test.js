import LinuxSecurity from './LinuxSecurity'
import kmd from '../../lib/kmd'

jest.mock('../../lib/kmd')

afterEach(() => {
  kmd.mockReset()
})

describe('Linux applications resolver', () => {
  it('specifies reason when not installed', async () => {
    const name = 'fooApp'

    kmd.mockResolvedValue({
      apps: [
        {name: 'barSuite', version: '10.0.3'}
      ]
    })

    const result = await LinuxSecurity.applications(
      null,
      [
        {
          name,
          platform: {
            linux: ">=14.04"
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

    const result = await LinuxSecurity.applications(
      null,
      [
        {
          name,
          version: ">=2.0.0",
          platform: {
            linux: ">=14.04"
          }
        }
      ],
      {}
    )

    expect(result[0].reason).toEqual("OUT_OF_DATE")
 })

 it('ignores debian version epoch', async () => {
   // see https://manpages.debian.org/stretch/dpkg-dev/deb-version.5.en.html
    const name = 'fooApp'
    const versionWithEpoch = '3:2.0.4'

    kmd.mockResolvedValue({
      apps: [
        {name: 'fooApp', version: versionWithEpoch}
      ]
    })

    const result = await LinuxSecurity.applications(
      null,
      [
        {
          name,
          version: ">=2.0.0",
          platform: {
            linux: ">=14.04"
          }
        }
      ],
      {}
    )

    expect(result[0].version).toEqual(versionWithEpoch)
 })

 it('ignores trailing debian revisions', async () => {
   // see https://manpages.debian.org/stretch/dpkg-dev/deb-version.5.en.html
    const name = 'fooApp'
    const debianVersion = '3.28.0.2-1ubuntu1.18.04.1'

    kmd.mockResolvedValue({
      apps: [
        {name: 'fooApp', version: debianVersion}
      ]
    })

    const result = await LinuxSecurity.applications(
      null,
      [
        {
          name,
          version: "=3.28.0",
          platform: {
            linux: ">=14.04"
          }
        }
      ],
      {}
    )

    expect(result[0].version).toEqual(debianVersion)
 })

})
