module.exports = {
  command: 'help',
  description: 'Displays this message, duh!',
  parameters: [],
  rank: 0,
  execute: function (msg, commands) {
    var str = 'Available commands:'
    for (var key in commands) {
      if (!commands.hasOwnProperty(key)) {
        continue
      }
      var c = commands[key]
      // console.log(c)
      if (!c.hidden) {
        var rank = ''
        if (c.rank === 2) {
          rank = 'VIP'
        } else if (c.rank === 3) {
          rank = 'Owner'
        } else if (c.rank === 4) {
          rank = 'Admin'
        } else {
          rank = 'Anyone'
        }
        str += `\n* ${key} (${rank})`
        for (var j = 0; j < c.parameters.length; j++) {
          str += ` <${c.parameters[j]}>`
        }
        str += `: ${c.description}`
      }
    }
    msg.member.openDM()
        .then(dm => {
          dm.sendMessage(str)
        })
    var retStr = 'Command list sent!'
    return {promise: msg.reply(retStr), content: retStr}
  }
}
