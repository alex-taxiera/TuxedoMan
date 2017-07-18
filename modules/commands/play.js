const db = require('../database.js')
const music = require('../music.js')
const Command = require('./command.js')
const Response = require('../response.js')

module.exports = new Command(
  'play',
  'Resumes paused/stopped playback',
  [],
  'Anyone in Voice',
  false,
  function (msg) {
    let str = ''
    let client = db.getGuildInfo(msg.guild.id)

    if (!client.isPlaying && client.queue.length === 0) {
      if (client.autoplay) {
        client.paused = false
        music.autoQueue(client)

        str = 'Starting!'
      } else {
        str = 'Turn autoplay on, or use search or request to pick a song!'
      }
    } else if (client.paused) {
      client.paused = false

      if (client.isPlaying) {
        client.encoder.voiceConnection.getEncoderStream().uncork()
      }

      str = 'Resuming!'
    } else {
      str = 'Playback is already running'
    }
    return new Response(msg, str)
  }
)
