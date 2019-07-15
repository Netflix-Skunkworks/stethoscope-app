import linuxFriendlyName from './LinuxDeviceName'
import macFriendlyName from '../../sources/macmodels'

describe('linuxFriendlyName', () => {
  it('should return "Unknown device" when no data is passed', async () => {
    const hardwareVersion = ''
    const friendlyName = linuxFriendlyName(hardwareVersion)
    expect(friendlyName).toEqual('Unknown device')
  })

  it('should return verbatim input when unknown vendor', async () => {
    const hardwareVersion = 'UnknownVendor | UnknownBoard-892/736h9 | UnknownProduct-?qwo29'
    const friendlyName = linuxFriendlyName(hardwareVersion)
    expect(friendlyName).toEqual(hardwareVersion)
  })

  it('should return desired format when vendor is Dell', async () => {
    const hardwareVersion = 'Dell Inc. | XPS 13 9380 | 0KTW76'
    const friendlyName = linuxFriendlyName(hardwareVersion)
    expect(friendlyName).toEqual('Dell XPS 13 9380 (0KTW76)')
  })

  it('should return desired format when vendor is Apple', async () => {
    const hardwareVersion = 'Apple Inc. | MacBookPro11,1 | Mac-189A3D4F975D5FFC'
    const friendlyName = linuxFriendlyName(hardwareVersion)
    expect(friendlyName).toEqual(macFriendlyName('MacBookPro11,1'))
  })

  it('should return desired format when vendor is Intel', async () => {
    const hardwareVersion = 'Intel Corporation | NUC7i5BNK | NUC7i5BNB'
    const friendlyName = linuxFriendlyName(hardwareVersion)
    expect(friendlyName).toEqual('Intel NUC7i5BNK')
  })
})
