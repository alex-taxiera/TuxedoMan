const db = require('../database.js')
const Response = require('../response.js')

module.exports = {
  command: 'stop',
  description: 'Delete current song and prevent further playback',
  parameters: [],
  rank: 1,
  execute: function (msg) {
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''

    if (client.isPlaying) {
      client.paused = true
      client.encoder.destroy()
      client.nowPlaying = {}

      str = 'Stopping...'
    } else {
      str = 'Bot is not playing anything!'
    }
    return new Response(msg, str)
  }
}
