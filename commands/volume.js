const func = require('../common.js')
const music = require('../music.js')
module.exports = {
  command: 'volume',
  description: 'Set music volume.',
  parameters: ['number (1-200)'],
  rank: 1,
  execute: function (msg, params) {
    var str = ''
    if (params[1] / 2 > 0 && params[1] / 2 <= 100) {
      var client = func.getClient(msg.guild.id)
      if (params[1] / 2 === client.volume) {
        str = 'Volume is already at that level!'
        return {promise: msg.reply(str), content: str}
      } else {
        music.volume(client, params[1] / 2)
        str = 'Volume set!'
        return {promise: msg.reply(str), content: str}
      }
    } else {
      str = 'Invalid volume level!'
      return {promise: msg.reply(str), content: str}
    }
  }
}
