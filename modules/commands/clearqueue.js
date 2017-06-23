const func = require('../common.js')

module.exports = {
  command: 'clearqueue',
  description: 'Removes all songs from the queue',
  parameters: [],
  rank: 2,
  execute: function (msg) {
    var client = func.getClient(msg.guild.id)
    var str = ''
    client.queue = []
    str = 'Queue has been cleared!'
    return {promise: msg.reply(str), content: str}
  }
}
