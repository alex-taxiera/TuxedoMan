const func = require('./common.js')
const commands = require('./commands/')
const permissions = require('./permissions/')
const db = require('./database.js')

module.exports = {
  handleCommand: async function (msg, text) {
    let command = ''
    let params = text.split(' ')
    command = commands[params[0]]
    if (command) {
      if (params.length - 1 < command.parameters.length) {
        msg.channel.createMessage(msg.author.mention + ' insufficient parameters!')
        .then((m) => {
          setTimeout(function () { m.delete() }, 10000)
        })
      } else {
        let perm = permissions[command.perm]
        if (await allow(perm, msg)) {
          params.splice(0, 1)
          if (command.name === 'help') {
            params = commands
          }
          func.messageHandler(await command.execute(msg, params))
        } else {
          func.messageHandler(perm.deny(msg))
        }
        if (func.can(['manageMessages'], msg.channel)) {
          msg.delete()
        }
      }
    }
  }
}

async function allow (perm, msg) {
  let info = db.getGuildInfo(msg.channel.guild.id)
  let member = msg.member
  let keys = Object.keys(permissions)
  for (let i = keys.indexOf(perm.name); i < keys.length; i++) {
    if (await permissions[keys[i]].check(info, member, msg)) {
      return true
    }
  }
  return false
}
