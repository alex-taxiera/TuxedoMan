const db = require('../database.js')
const music = require('../music.js')
const Command = require('./command.js')
const Response = require('../response.js')

module.exports = new Command(
  'volume',
  'Set music volume.',
  ['number (1-200)'],
  'Anyone in Voice',
  false,
  function (msg, params) {
    let str = ''

    if (params[0] / 2 > 0 && params[0] / 2 <= 100) {
      let client = db.getGuildInfo(msg.guild.id)
      if (params[0] / 2 === client.volume) {
        str = 'Volume is already at that level!'
      } else {
        music.volume(client, params[0] / 2)
        str = 'Volume set!'
      }
    } else {
      str = 'Invalid volume level!'
    }
    return new Response(msg, str)
  }
)
