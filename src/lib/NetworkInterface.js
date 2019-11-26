export default class NetworkInterface {
  static isLocal (mac = '') {
    const [octet] = mac.split(':')
    return Number(parseInt(octet, 16)) & 0b10
  }

  static isMulticast (mac = '') {
    const [octet] = mac.split(':')
    return Number(parseInt(octet, 16)) & 0b1
  }

  static isPlaceholder (mac = '') {
    return mac.startsWith('00:00:00')
  }
}

if (require.main === module) {
  const testMac = '0e:a9:04:7d:0d:d5'
  const multiMac = '01:00:0C:CC:CC:CC'
  const placeMac = '00:00:00:00:00:00'

  console.assert(NetworkInterface.isLocal(testMac))
  console.log('isLocal passed ✓')
  console.assert(NetworkInterface.isMulticast(multiMac))
  console.log('isMulticast passed ✓')
  console.assert(NetworkInterface.isPlaceholder(placeMac))
  console.log('isPlaceholder passed ✓')
  console.log(__filename, 'tests passed')
}
