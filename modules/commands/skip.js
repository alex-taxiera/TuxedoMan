const db = require('../database.js')

module.exports = {
  command: 'skip',
  description: 'Skips the current song',
  parameters: [],
  rank: 1,
  execute: function (msg) {
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''
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
