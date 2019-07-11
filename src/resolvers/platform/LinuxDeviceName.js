import macFriendlyName from '../../sources/macmodels'

export default function getFriendlyName (hardwareVersion) {
  const trimmedName = (hardwareVersion || '').trim()
  let friendlyName = 'Unknown device'
  if (trimmedName) {
    const tokens = trimmedName.split('|')
    const boardVendor = tokens[0].trim()
    const productName = tokens[1].trim()
    const boardName = tokens[2].trim()
    friendlyName = formatByVendor(boardVendor, productName, boardName)
    if (!friendlyName) {
      friendlyName = trimmedName
    }
  }
  return friendlyName
}

function formatByVendor (boardVendor, productName, boardName) {
  switch (boardVendor) {
    case 'Dell Inc.':
      return `Dell ${productName} (${boardName})`
    case 'Apple Inc.':
      return macFriendlyName(productName)
    case 'Intel Corporation':
      return `Intel ${productName}`
    default:
      return null
  }
}
