const func = require('../common.js')

module.exports = {
  command: 'stop',
  description: 'Delete current song and prevent further playback',
  parameters: [],
  rank: 1,
  execute: function (msg) {
    let client = func.getClient(msg.guild.id)
    let str = ''
    if (client.isPlaying) {
      client.paused = true
      client.encoder.destroy()
      client.nowPlaying = {}
      str = 'Stopping...'
      return {promise: msg.reply(str), content: str}
    } else {
      str = 'Bot is not playing anything!'
      return {promise: msg.reply(str), content: str}
    }
  }
}
