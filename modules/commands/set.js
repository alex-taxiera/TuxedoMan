const func = require('../common.js')
const main = require('../../TuxedoMan.js')
const db = require('../database.js')
const Response = require('../response.js')

module.exports = {
  command: 'set',
  description: 'Set default voice or text channel',
  parameters: [`"voice/text"`, 'channel name'],
  rank: 2,
  execute: function (msg, params) {
    const bot = main.bot()
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''

    let type = params[0]
    params.splice(0, 1)
    let fullParam = params.join(' ')
    let channel = {}

    switch (type) {
      case 'text':
        channel = bot.Channels.textForGuild(client.guild.id)
        .find((channel) => channel.name === fullParam)
        type = false // false for text
        break
      case 'voice':
        channel = bot.Channels.voiceForGuild(client.guild.id)
        .find((channel) => channel.name === fullParam)
        type = true // true for voice
        break
      default:
        str = 'Specify text or voice with first param!'
        return new Response(msg, str)
    }

    if (channel) {
      if (client.text.id !== channel.id && client.voice.id !== channel.id) {
        if (!type) { // text
          if (func.can(['READ_MESSAGES'], channel)) {
            if (func.can(['SEND_MESSAGES'], channel)) {
              client.text = {id: channel.id, name: channel.name}
              db.updateGuilds(client)

              str = 'Default set!'
            } else {
              str = 'Cannot send messages there!'
            }
          } else {
            str = 'Cannot read messages there!'
          }
        } else { // voice
          if (func.can(['CONNECT'], channel)) {
            if (func.can(['SPEAK'], channel)) {
              client.voice = {id: channel.id, name: channel.name}
              db.updateGuilds(client)
              channel.join()

              str = 'Default set!'
            } else {
              str = 'Cannot speak in that channel!'
            }
          } else {
            str = 'Cannot connect to that channel!'
          }
        }
      } else {
        str = 'Already default channel!'
      }
    } else {
      str = `Could not find ${params[0]} channel!`
    }
    return new Response(msg, str)
  }
}
