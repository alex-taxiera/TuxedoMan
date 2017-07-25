const db = require('../database.js')
const Command = require('./command.js')
const Response = require('../response.js')

module.exports = new Command(
  'vip',
  'Set VIP role',
  ['role name'],
  'Owner',
  false,
  function (msg, params) {
    let fullParam = params.join(' ')
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''

    let role = msg.guild.roles.find(r => r.name === fullParam)
    if (role) {
      if (role !== client.vip) {
        client.vip = role.id
        db.updateGuilds(client)
        str = 'VIP set!'
      } else {
        str = 'VIP is already set to that role!'
      }
    } else {
      str = `Could not find role "${fullParam}"`
    }
    return new Response(msg, str)
  }
)
