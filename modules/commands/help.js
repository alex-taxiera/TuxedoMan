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
      // console.log(c)
      if (!c.hidden) {
        let rank = ''
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
