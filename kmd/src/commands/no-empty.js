const noEmpty = () => (items) => {
  return items
    .filter(item => {
      const included = (item !== null &&
      typeof item !== 'undefined' &&
      (typeof item !== 'object' || Object.keys(item).length > 0) &&
      (typeof item !== 'string' || item.length > 0))
      return included
    })
}

module.exports = noEmpty
