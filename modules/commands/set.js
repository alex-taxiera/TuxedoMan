const func = require('../common.js')
const db = require('../database.js')
const Command = require('../classes/Command.js')
const Response = require('../classes/Response.js')

module.exports = new Command(
  'set',
  'Set default voice or text channel',
  [`"voice/text"`, 'channel name'],
  'VIP',
  function (msg, params) {
    const bot = require('../../TuxedoMan.js')
    let id = msg.guild.id
    let guildInfo = db.getGuildInfo(id)
    let str = ''

    let type = params[0]
    params.splice(0, 1)
    let fullParam = params.join(' ')
    let channel = {}

    switch (type) {
      case 'text':
        channel = bot.Channels.textForGuild(id)
        .find((channel) => channel.name === fullParam)
        type = false // false for text
        break
      case 'voice':
        channel = bot.Channels.voiceForGuild(id)
        .find((channel) => channel.name === fullParam)
        type = true // true for voice
        break
      default:
        str = 'Specify text or voice with first param!'
        return new Response(msg, str)
    }

    if (channel) {
      if (guildInfo.text.id !== channel.id && guildInfo.voice.id !== channel.id) {
        if (!type) { // text
          if (func.can(['READ_MESSAGES'], channel)) {
            if (func.can(['SEND_MESSAGES'], channel)) {
              guildInfo.text = {id: channel.id, name: channel.name}

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
              guildInfo.voice = {id: channel.id, name: channel.name}
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
)
