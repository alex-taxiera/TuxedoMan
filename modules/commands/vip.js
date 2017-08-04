const db = require('../database.js')
const Command = require('../classes/Command.js')
const Response = require('../classes/Response.js')

module.exports = new Command(
  'vip',
  'Set VIP role',
  ['role name'],
  'Owner',
  false,
  function (msg, params) {
    let fullParam = params.join(' ')
    let guildInfo = db.getGuildInfo(msg.guild.id)
    let str = ''

    let role = msg.guild.roles.find(r => r.name === fullParam)
    if (role) {
      if (role !== guildInfo.vip) {
        guildInfo.vip = role.id
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
