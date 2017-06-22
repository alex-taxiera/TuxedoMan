const func = require('../common.js')
const cmd = require('../commands.js')
const moment = require('moment')
module.exports = {
  command: 'eval',
  description: 'dev',
  parameters: ['stuff'],
  rank: 4,
  hidden: true,
  execute: function (msg, params) {
    var client = func.getClient(msg.guild.id)
    var fullParam = params.join(' ')

    var member = msg.guild.members.find(m => m.id === global.bot.User.id)
    try {
      var response = Promise.resolve(eval(fullParam))
      response.then((results) => {
        var promise = results
        if (!results) {
          promise = 'No Promise'
        }
        var desc = '```' + '       EVAL' + '```' + '**INPUT:**\n' + '``' + `${fullParam}` + '``\n' + '**PROMISE:**\n' + '``' + `${promise}` + '``'
        var embed =
          {
            'description': desc,
            'timestamp': moment(),
            color: 0x3498db,
            'footer': {
              'icon_url': 'https://raw.githubusercontent.com/alex-taxiera/TuxedoMan/indev/images/tuxedoman.png',
              'text': 'TuxedoMan'
            },
            'author': {
              'name': member.nick,
              'url': 'https://github.com/alex-taxiera/TuxedoMan',
              'icon_url': member.avatarURL
            }
          }
        return func.messageHandler({promise: msg.channel.sendMessage('', false, embed), content: '', delay: 0, embed: embed})
      })
    } catch (e) {
      func.log(`could not eval "${fullParam}"`, e.message)
    }
  }
}
