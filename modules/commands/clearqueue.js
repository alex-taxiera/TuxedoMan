const db = require('../database.js')
const Command = require('./command.js')
const Response = require('../response.js')

module.exports = new Command(
  'clearqueue',
  'Removes all songs from the queue',
  [],
  'VIP',
  false,
  function (msg) {
    let str = ''
    let client = db.getGuildInfo(msg.guild.id)
    client.queue = []
    str = 'Queue has been cleared!'
    return new Response(msg, str)
  }
)
