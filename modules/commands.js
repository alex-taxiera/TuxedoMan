const func = require('./common.js')
const commands = require('./commands/')
const db = require('./database.js')
const Response = require('./classes/Response.js')

module.exports = {
  handleCommand: async function (msg, text, meme = false) {
    let command = ''
    let params = text.split(' ')
    command = commands[params[0]]
    if (command) {
      if (params.length - 1 < command.parameters.length) {
        return msg.reply('Insufficient parameters!')
        .then((m) => {
          setTimeout(function () { m.delete() }, 10000)
        })
      } else {
        let memberRank = await rank(msg.member, command.rank)
        if (memberRank) {
          params.splice(0, 1)
          if (command.name === 'help') {
            params = commands
          }
          func.messageHandler(command.execute(msg, params))
        } else {
          func.messageHandler(denyRank(msg, command.rank))
        }
        if (func.can(['MANAGE_MESSAGES'], msg.channel)) {
          msg.delete()
        }
      }
    }
  }
}

function denyRank (msg, rank) {
  let str = ''

  switch (rank) {
    case 'Anyone in Voice':
      str = `Must be in voice chat with ${require('../TuxedoMan.js').User.username}`
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

async function rank (member, rank) {
  let bot = require('../TuxedoMan.js')
  let id = member.guild.id
  let vip = db.getClient(id).vip

  switch (rank) {
    case 'Anyone in Voice':
      if (bot.User.getVoiceChannel(id).id === member.getVoiceChannel().id) {
        return true
      }
    case 'VIP':
      if (vip && member.hasRole(vip)) {
        return true
      }
    case 'Owner':
      if (member.guild.isOwner(member)) {
        return true
      }
    case 'Admin':
      let admin = await bot.User.getApplication()
      if (member.id === admin.owner.id) {
        return true
      }
      break
    default:
      return true
  }
  return false
}
