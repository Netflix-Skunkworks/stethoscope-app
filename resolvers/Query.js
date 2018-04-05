module.exports = {
  async device (root, args, context) {
    const info = await context.systemInfo
    return info
  },

  async policy (root, args, context) {
    return {
      result: 'FAIL'
    }
  }
}
