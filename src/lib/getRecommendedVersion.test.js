import getRecommendedVersion from './getRecommendedVersion'

describe('getRecommendedVersion', () => {
  it('should handle standard semver strings', () => {
    const version = '>=14.3.3'
    const recommended = getRecommendedVersion(version)
    expect(recommended.raw).toEqual('14.3.3')
  })

  it('should handle advanced semver strings', () => {
    const version = '<15 >=14.3.3 || >16.1.0'
    const recommended = getRecommendedVersion(version)
    expect(recommended.raw).toEqual('16.1.1')
  })

  it('should find the minimum when out of order', () => {
    const version = '>16.1.0 || <15 >=14.3.3'
    const recommended = getRecommendedVersion(version)
    expect(recommended.raw).toEqual('16.1.1')
  })
})
