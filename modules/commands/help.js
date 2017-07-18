const Response = require('../response.js')

module.exports = {
  command: 'help',
  description: 'Displays this message, duh!',
  parameters: [],
  rank: 0,
  execute: function (msg, commands) {
    let str = 'Available commands:'

    for (let key in commands) {
      if (!commands.hasOwnProperty(key)) {
        continue
      }

      let c = commands[key]
      if (!c.hidden) {
        str += `\n* ${key} (${getRank(c.rank)})`

        for (let j = 0; j < c.parameters.length; j++) {
          str += ` <${c.parameters[j]}>`
        }
        str += `: ${c.description}`
      }
    }

    msg.member.openDM()
    .then(dm => {
      dm.sendMessage(str)
    })

    let retStr = 'Command list sent!'
    return new Response(msg, retStr)
  }
}

function getRank (rank) {
  switch (rank) {
    case 4:
      return 'Admin'
    case 3:
      return 'Owner'
    case 2:
      return 'VIP'
    default:
      return 'Anyone'
  }
}
