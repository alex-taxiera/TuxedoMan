const db = require('../database.js')

module.exports = {
  command: 'clearqueue',
  description: 'Removes all songs from the queue',
  parameters: [],
  rank: 2,
  execute: function (msg) {
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''
    client.queue = []
    str = 'Queue has been cleared!'
    return {promise: msg.reply(str), content: str}
  }
}
