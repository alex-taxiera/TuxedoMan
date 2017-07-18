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
          if (rank(msg) >= command.rank) {
            params.splice(0, 1)
            if (command.command === 'help') {
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
    case 1:
      str = `Must be in voice chat with ${main.bot().User.username}`
      break
    case 2:
      str = 'Must be VIP!'
      break
    case 3:
      str = 'Must be guild owner!'
      break
    case 4:
      str = 'Must be a boss!'
      break
  }
  return new Response(msg, str)
}

function rank (msg) {
  let client = db.getGuildInfo(msg.guild.id)

  if (msg.member.id === config.admin) {
    return 4
  } else if (msg.guild.isOwner(msg.member)) {
    return 3
  } else if (msg.member.hasRole(client.vip)) {
    return 2
  } else if (main.bot().User.getVoiceChannel(client.guild.id)
  .members.includes(msg.member.id)) {
    return 1
  } else {
    return 0
  }
}
