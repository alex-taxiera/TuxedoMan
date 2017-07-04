const func = require('../common.js')
const main = require('../../TuxedoMan.js')
const db = require('../database.js')
const cmd = require('../commands.js')
const moment = require('moment')
const config = require('../../config.json')

module.exports = {
  command: 'eval',
  description: 'dev',
  parameters: ['stuff'],
  rank: 4,
  hidden: true,
  execute: function (msg, params) {
    let bot = main.bot()
    let client = db.getGuildInfo(msg.guild.id)
    let fullParam = params.join(' ')

    let member = msg.guild.members.find(m => m.id === bot.User.id)
    try {
      let response = Promise.resolve(eval(fullParam))
      response.then((results) => {
        let promise = results
        if (!results) {
          promise = 'No Promise'
        }
        let desc = '**INPUT:**\n' + '```js\n' + `${fullParam}` + '```\n' + '**PROMISE:**\n' + '```js\n' + `${promise}` + '```'
        let embed =
          {
            description: ':gear:[**Evaluation**](https://github.com/alex-taxiera/TuxedoMan)\n\n' + desc,
            'timestamp': moment(),
            color: 0x3498db,
            'footer': {
              'icon_url': 'https://raw.githubusercontent.com/alex-taxiera/TuxedoMan/indev/images/tuxedoman.png',
              'text': 'TuxedoMan'
            }
          }
        return func.messageHandler({promise: msg.channel.sendMessage('', false, embed), content: '', delay: 0, embed: embed})
      })
    } catch (e) {
      func.log(`could not eval "${fullParam}"`, e.message)
    }
  }
}
