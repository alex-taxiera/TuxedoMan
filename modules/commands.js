const func = require('./common.js')
const commands = require('./commands/')
const permissions = require('./permissions/')
const db = require('./database.js')

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
        let perm = permissions[command.rank]
        if (allow(perm, msg)) {
          params.splice(0, 1)
          if (command.name === 'help') {
            params = commands
          }
          func.messageHandler(command.execute(msg, params))
        } else {
          func.messageHandler(perm.deny(msg))
        }
        if (func.can(['MANAGE_MESSAGES'], msg.channel)) {
          msg.delete()
        }
      }
    }
  }
}

async function allow (perm, msg) {
  let info = db.getGuildInfo(msg.guild.id)
  let member = msg.member
  if (perm.check(info, member, msg)) {
    return true
  } else {
    let keys = Object.keys(permissions)
    for (let i = keys.indexOf(perm.name) + 1; i < keys.length; i++) {
      if (permissions[keys[i]].check(info, member, msg)) {
        return true
      }
    }
  }
  return false
}
