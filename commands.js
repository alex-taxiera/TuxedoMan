const func = require('./common.js')
const bot = require('./TuxedoMan.js')
const commands = require('./commands/')

module.exports = {
  handleCommand: function (msg, text, meme) {
    var command = ''
    if (!meme) {
      var client = func.getClient(msg.guild.id)
      var params = text.split(' ')
      command = commands[params[0]]

      if (command) {
        if (params.length - 1 < command.parameters.length) {
          return msg.reply('Insufficient parameters!').then((m) => {
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
          return true
        }
      }
    } else {
      command = searchCommand('memes')
      return command.execute(msg, text)
    }
  }
}

function searchCommand (commandName) {
  return (commands.find(cmd => cmd.command === commandName.toLowerCase()))
}

function denyRank (msg, rank) {
  var str = ''
  switch (rank) {
    case 1:
      str = `Must be in voice chat with ${bot.get().User.username}`
      return {promise: msg.reply(str), content: str}
    case 2:
      str = 'Must be VIP!'
      return {promise: msg.reply(str), content: str}
    case 3:
      str = 'Must be guild owner!'
      return {promise: msg.reply(str), content: str}
    case 4:
      str = 'Must be a boss!'
      return {promise: msg.reply(str), content: str}
  }
}

function rank (msg) {
  var client = func.getClient(msg.guild.id)
  if (msg.member.id === global.master) {
    return 4
  } else if (msg.guild.isOwner(msg.member)) {
    return 3
  } else if (client.vip && msg.member.hasRole(client.vip)) {
    return 2
  } else if (bot.get().User.getVoiceChannel(client.guild.id).members
  .findIndex(m => m.id === msg.member.id) !== -1) {
    return 1
  } else {
    return 0
  }
}
