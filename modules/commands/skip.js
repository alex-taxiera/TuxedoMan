const func = require('../common.js')

module.exports = {
  command: 'skip',
  description: 'Skips the current song',
  parameters: [],
  rank: 1,
  execute: function (msg) {
    var client = func.getClient(msg.guild.id)
    var str = ''
    if (client.isPlaying) {
      client.encoder.destroy()
      str = 'Skipping...'
      return {promise: msg.reply(str), content: str}
    } else {
      str = 'There is nothing being played.'
      return {promise: msg.reply(str), content: str}
    }
  }
}
