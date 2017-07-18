const db = require('../database.js')
const Command = require('./command.js')
const Response = require('../response.js')

module.exports = new Command(
  'pause',
  'Pauses your shit',
  [],
  'Anyone in Voice',
  false,
  function (msg) {
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''

    if (client.paused) {
      str = 'Playback is already paused!'
    } else {
      client.paused = true

      if (client.isPlaying) {
        client.encoder.voiceConnection.getEncoderStream().cork()
      }
      str = 'Pausing!'
    }
    return new Response(msg, str)
  }
)
