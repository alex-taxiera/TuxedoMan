const func = require('./common.js')
const main = require('../TuxedoMan.js')
const commands = require('./commands/')
const config = require('../config.json')
const db = require('./database.js')
const Response = require('./response.js')

module.exports = {
  handleCommand: function (msg, text, meme = false) {
    let command = ''
    if (!meme) {
      let client = db.getGuildInfo(msg.guild.id)
      let params = text.split(' ')

      command = commands[params[0]]
      if (command) {
        if (params.length - 1 < command.parameters.length) {
          return msg.reply('Insufficient parameters!')
          .then((m) => {
            setTimeout(function () { m.delete() }, 10000)
          })
        } else {
          if (rank(msg.member, command.rank)) {
            params.splice(0, 1)
            if (command.name === 'help') {
              params = commands
            }
            func.messageHandler(command.execute(msg, params), client)
          } else if (rank(msg) < command.rank) {
            func.messageHandler(denyRank(msg, command.rank))
          }
          if (func.can(['MANAGE_MESSAGES'], msg.channel)) {
            msg.delete()
          }
        }
      }
    } else {
      return commands['memes'].execute(msg, text)
    }
  }
}

function denyRank (msg, rank) {
  let str = ''

  switch (rank) {
    case 'Anyone in Voice':
      str = `Must be in voice chat with ${main.bot().User.username}`
      break
    case 'VIP':
      str = 'Must be VIP!'
      break
    case 'Owner':
      str = 'Must be guild owner!'
      break
    case 'Admin':
      str = 'Must be a boss!'
      break
  }
  return new Response(msg, str)
}

function rank (member, rank) {
  let client = db.getGuildInfo(member.guild.id)
  let vip = client.vip

  switch (rank) {
    case 'Anyone in Voice':
      if (main.bot().User.getVoiceChannel(client.guild.id)
      .members.includes(member.id)) {
        return true
      }
    case 'VIP':
      if (vip && member.hasRole(vip)) {
        return true
      }
    case 'Owner':
      if (client.guild.isOwner(member)) {
        return true
      }
    case 'Admin':
      if (member.id === config.admin) {
        return true
      }
      break
    default:
      return true
  }
  return false
}
