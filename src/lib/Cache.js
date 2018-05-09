module.exports = class Cache {
  constructor() {
    this.store = new Map()
  }

  set(key, value, expiration = Infinity) {
    this.store.set(key, value)
    setTimeout(() => {
      this.store.delete(key)
    }, expiration)
  }

  has(key) {
    return this.store.has(key)
  }

  get(key) {
    if (this.store.has(key)) {
      return this.store.get(key)
    }
    return undefined
  }
}
