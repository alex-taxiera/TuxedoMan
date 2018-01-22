module.exports = class Response {
  constructor (message, string, delay, embed) {
    this.message = message
    if (embed) {
      this.content = { string, embed }
    } else {
      this.content = string
    }
    if (delay) {
      this.delay = delay
    } else {
      this.delay = 10000
    }
  }
}
