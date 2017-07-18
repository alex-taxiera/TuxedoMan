const func = require('../common.js')
const main = require('../../TuxedoMan.js')
const db = require('../database.js')
const cmd = require('../commands.js')
const Response = require('../response.js')
const moment = require('moment')
const fs = require('fs')
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
    let member = msg.guild.members.find(m => m.id === bot.User.id)
    let fullParam = params.join(' ')

    try {
      let response = Promise.resolve(eval(fullParam))
      response.then((results) => {
        let promise = results
        if (!results) {
          promise = 'No Promise'
        }
        let embed = evalEmbed(fullParam, { promise: promise })
        return func.messageHandler(new Response(msg, '', 12000, embed), client)
      })
    } catch (e) {
      let embed = evalEmbed(fullParam, { error: e.message })
      return func.messageHandler(new Response(msg, '', 12000, embed), client)
    }
  }
}

function evalEmbed (fullParam, output) {
  let desc = '**INPUT:**\n' + '```js\n' + `${fullParam}` + '```\n'

  if (output.promise) {
    desc += '**PROMISE:**\n' + '```js\n' + `${output.promise}` + '```'
  } else {
    desc += '**ERROR:**\n' + '```js\n' + `${output.error}` + '```'
  }

  return {
    description: ':gear:[**Evaluation**](https://github.com/alex-taxiera/TuxedoMan)\n\n' + desc,
    timestamp: moment(),
    color: 0x3498db,
    footer: {
      icon_url: 'https://raw.githubusercontent.com/alex-taxiera/TuxedoMan/indev/images/tuxedoman.png',
      text: 'TuxedoMan'
    }
  }
}
