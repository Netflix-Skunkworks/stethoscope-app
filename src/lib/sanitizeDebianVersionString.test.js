import sanitizeDebianVersionString from './sanitizeDebianVersionString'

describe('sanitizeDebianVersionString', () => {

  it('should not change semver-compatible versions', () => {
    const sanitized = sanitizeDebianVersionString('1.2.3')
    expect(sanitized).toEqual('1.2.3')
  })

  it('should remove leading epochs', () => {
    const sanitized = sanitizeDebianVersionString('2:1.0.0')
    expect(sanitized).toEqual('1.0.0')
  })

  it('should remove trailing debian revisions', () => {
    expect(sanitizeDebianVersionString('1:13.3.0-2build1~18.04.1')).toEqual('13.3.0')
    expect(sanitizeDebianVersionString('2:8.39-9')).toEqual('8.39')
    expect(sanitizeDebianVersionString('2:8.39-9')).toEqual('8.39')
    expect(sanitizeDebianVersionString('3.28.0.2-1ubuntu1.18.04.1')).toEqual('3.28.0')   // NOTE: lossy match
    expect(sanitizeDebianVersionString('1.1.24+nmu5ubuntu1')).toEqual('1.1.24')
    expect(sanitizeDebianVersionString('1:1.2.11.dfsg-0ubuntu2')).toEqual('1.2.11')
  })
})