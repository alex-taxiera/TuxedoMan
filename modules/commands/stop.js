const db = require('../database.js')
const Command = require('./command.js')
const Response = require('../response.js')

module.exports = new Command(
  'stop',
  'Delete current song and prevent further playback',
  [],
  'Anyone in Voice',
  false,
  function (msg) {
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
)
