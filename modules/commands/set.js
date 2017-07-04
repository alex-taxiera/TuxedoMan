const func = require('../common.js')
const main = require('../../TuxedoMan.js')
const db = require('../database.js')

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
    if (type === `text`) {
      channel = bot.Channels.textForGuild(client.guild.id)
      .find((channel) => channel.name === fullParam)
      type = 0 // false for text
    } else if (type === 'voice') {
      channel = bot.Channels.voiceForGuild(client.guild.id)
      .find((channel) => channel.name === fullParam)
      type = 1 // true for voice
    } else {
      str = 'Specify text or voice with first param!'
      return {promise: msg.reply(str), content: str}
    }
    if (channel) {
      if (client.text.id !== channel.id && client.voice.id !== channel.id) {
        if (!type) {
          if (func.can(['READ_MESSAGES'], channel)) {
            if (func.can(['SEND_MESSAGES'], channel)) {
              client.text = {id: channel.id, name: channel.name}
              db.updateGuilds(client)
              str = 'Default set!'
              return {promise: msg.reply(str), content: str}
            } else {
              str = 'Cannot send messages there!'
              return {promise: msg.reply(str), content: str}
            }
          } else {
            str = 'Cannot read messages there!'
            return {promise: msg.reply(str), content: str}
          }
        } else if (type) {
          if (func.can(['CONNECT'], channel)) {
            if (func.can(['SPEAK'], channel)) {
              client.voice = {id: channel.id, name: channel.name}
              db.updateGuilds(client)
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
