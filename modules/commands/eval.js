const func = require('../common.js')
const main = require('../../TuxedoMan.js')
const db = require('../database.js')
const cmd = require('../commands.js')
const Command = require('./command.js')
const Response = require('../response.js')
const moment = require('moment')
const fs = require('fs')
const util = require('util')
const config = require('../../config.json')

module.exports = new Command(
  'eval',
  'dev',
  ['stuff'],
  'Admin',
  true,
  function (msg, params) {
    let bot = main.bot()
    let client = db.getGuildInfo(msg.guild.id)
    let member = msg.guild.members.find(m => m.id === bot.User.id)
    let fullParam = params.join(' ')

    try {
      let response = Promise.resolve(eval(fullParam))
      response.then((results) => {
        let promise = results
        if (!results) {
          promise = 'No Result'
        } else if (promise instanceof Object) {
          promise = `${util.inspect(promise)}`
        }
        let embed = evalEmbed(fullParam, { promise: promise })
        return func.messageHandler(new Response(msg, '', 12000, embed), client)
      })
    } catch (e) {
      let embed = evalEmbed(fullParam, { error: e.message })
      return func.messageHandler(new Response(msg, '', 12000, embed), client)
    }
  }
)

function evalEmbed (fullParam, output) {
  let desc = '**INPUT:**\n' + '```js\n' + `${fullParam}` + '```\n'

  if (output.promise) {
    desc += '**OUTPUT:**\n' + '```js\n' + `${output.promise}` + '```'
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
