const func = require('../common.js')

module.exports = {
  command: 'np',
  description: 'Displays the current song',
  parameters: [],
  rank: 0,
  execute: function (msg) {
    var client = func.getClient(msg.guild.id)
    var str = 'Now playing: '
    if (client.isPlaying) {
      str += `"${client.nowPlaying.title}" (requested by ${client.nowPlaying.user.username})`
    } else {
      str += 'nothing!'
    }
    return {promise: msg.reply(str), content: str}
  }
}
