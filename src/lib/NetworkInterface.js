module.exports = class NetworkInterface {
  static isLocal (mac) {
    const [ octet ] = mac.split(':')
    return Number(parseInt(octet, 16)) & 0b10
  }
  static isMulticast (mac) {
    const [ octet ] = mac.split(':')
    return Number(parseInt(octet, 16)) & 0b1
  }
  static isPlaceholder (mac) {
    return mac.startsWith('00:00:00')
  }
}
