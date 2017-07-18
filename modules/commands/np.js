const db = require('../database.js')
const Command = require('./command.js')
const Response = require('../response.js')

module.exports = new Command(
  'np',
  'Displays the current song',
  [],
  'Anyone',
  false,
  function (msg) {
    let client = db.getGuildInfo(msg.guild.id)
    let str = 'Now playing: '

    if (client.isPlaying) {
      str += `"${client.nowPlaying.title}" (requested by ${client.nowPlaying.user.username})`
    } else {
      str += 'nothing!'
    }
    return new Response(msg, str)
  }
)
