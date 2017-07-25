const db = require('../database.js')
const Command = require('./command.js')
const Response = require('../response.js')

module.exports = new Command(
  'skip',
  'Skips the current song',
  [],
  'Anyone in Voice',
  false,
  function (msg) {
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''

    if (client.isPlaying) {
      client.encoder.destroy()

      str = 'Skipping...'
    } else {
      str = 'There is nothing being played.'
    }
    return new Response(msg, str)
  }
)
