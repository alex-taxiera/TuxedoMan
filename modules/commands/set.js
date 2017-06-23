const func = require('../common.js')
const main = require('../../TuxedoMan.js')

module.exports = {
  command: 'set',
  description: 'Set default voice or text channel',
  parameters: [`"voice/text"`, 'channel name'],
  rank: 2,
  execute: function (msg, params) {
    const bot = main.bot()
    var client = func.getClient(msg.guild.id)
    var str = ''
    var type = params[0]
    params.splice(0, 1)
    var fullParam = params.join(' ')
    var channel = {}
    if (type === `text`) {
      channel = bot.Channels.textForGuild(msg.guild).find(tc => tc.name === fullParam)
      type = 0 // false for text
    } else if (type === 'voice') {
      channel = bot.Channels.voiceForGuild(msg.guild).find(vc => vc.name === fullParam)
      type = 1 // true for voice
    } else {
      str = 'Specify text or voice with first param!'
      return {promise: msg.reply(str), content: str}
    }
    if (channel) {
      if (client.textChannel.id !== channel.id && client.voiceChannel.id !== channel.id) {
        if (!type) {
          if (func.can(['SEND_MESSAGES'], channel)) {
            client.textChannel = {id: channel.id, name: channel.name}
            func.writeChanges()
            str = 'Default set!'
            return {promise: msg.reply(str), content: str}
          } else {
            str = 'Cannot send messages there!'
            return {promise: msg.reply(str), content: str}
          }
        } else if (type) {
          if (func.can(['CONNECT'], channel)) {
            if (func.can(['SPEAK'], channel)) {
              client.voiceChannel = {id: channel.id, name: channel.name}
              func.writeChanges()
              channel.join()
              str = 'Default set!'
              return {promise: msg.reply(str), content: str}
            } else {
              str = 'Cannot speak in that channel!'
              return {promise: msg.reply(str), content: str}
            }
          } else {
            str = 'Cannot connect to that channel!'
            return {promise: msg.reply(str), content: str}
          }
        }
      } else {
        str = 'Already default channel!'
        return {promise: msg.reply(str), content: str}
      }
    } else {
      str = `Could not find ${params[0]} channel!`
      return {promise: msg.reply(str), content: str}
    }
  }
}
