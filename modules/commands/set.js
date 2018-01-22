const func = require('../common.js')
const db = require('../database.js')
const Command = require('../classes/Command.js')
const Response = require('../classes/Response.js')

module.exports = new Command(
  'set',
  'Set default voice or text channel',
  [`"voice|text|vip|other"`, 'channel name'],
  'VIP',
  function (msg, params) {
    const bot = require('../../TuxedoMan.js')
    let id = msg.channel.guild.id
    let guildInfo = db.getGuildInfo(id)
    let str = ''

    let option = params[0]
    params.splice(0, 1)
    let fullParam = params.join(' ')
    let channel = {}

    switch (option) {
      case 'vip':
        let role = msg.channel.guild.roles.find(r => r.name === fullParam)
        if (role) {
          if (role.id !== guildInfo.vip) {
            guildInfo.vip = role.id
            str = 'VIP set!'
          } else {
            str = 'VIP is already set to that role!'
          }
        } else {
          str = `Could not find role "${fullParam}"`
        }
        break
      case 'other':
        return require('../gameRoles.js').addRole(msg, fullParam, true)
      case 'text':
        channel = bot.guilds.get(id).channels
        .filter((ch) => { return ch.type === 0 })
        .find((channel) => channel.name === fullParam)
        if (channel) {
          if (guildInfo.text.id !== channel.id) {
            if (func.can(['readMessages'], channel)) {
              if (func.can(['sendMessages'], channel)) {
                guildInfo.text = {id: channel.id, name: channel.name}
                str = 'Default set!'
              } else {
                str = 'Cannot send messages there!'
              }
            } else {
              str = 'Cannot read messages there!'
            }
          } else {
            str = 'Already default channel!'
          }
        } else {
          str = `Could not find ${fullParam} channel!`
        }
        break
      case 'voice':
        channel = bot.guilds.get(id).channels
        .filter((ch) => { return ch.type === 2 })
        .find((channel) => channel.name === fullParam)
        if (channel) {
          if (guildInfo.text.id !== channel.id) {
            if (func.can(['voiceConnect'], channel)) {
              if (func.can(['voiceSpeak'], channel)) {
                guildInfo.voice = {id: channel.id, name: channel.name}
                channel.join()
                .then(() => { require('./music.js').checkPlayer(channel.guild) })
                str = 'Default set!'
              } else {
                str = 'Cannot voiceSpeak in that channel!'
              }
            } else {
              str = 'Cannot voiceConnect to that channel!'
            }
          } else {
            str = 'Already default channel!'
          }
        } else {
          str = `Could not find ${fullParam} channel!`
        }
        break
      default:
        str = 'Specify text or voice with first param!'
        return new Response(msg, str)
    }
    return new Response(msg, str)
  }
)
