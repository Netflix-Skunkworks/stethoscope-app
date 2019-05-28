export default {
  async device (root, args, context) {
    return true
  },

  async policy (root, args, context) {
    return {
      result: 'FAIL'
    }
  }
}
