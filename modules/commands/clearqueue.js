const db = require('../database.js')
const Response = require('../response.js')

module.exports = {
  command: 'clearqueue',
  description: 'Removes all songs from the queue',
  parameters: [],
  rank: 2,
  execute: function (msg) {
    let str = ''
    let client = db.getGuildInfo(msg.guild.id)
    client.queue = []
    str = 'Queue has been cleared!'
    return new Response(msg, str)
  }
}
