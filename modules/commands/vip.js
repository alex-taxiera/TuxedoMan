const db = require('../database.js')

module.exports = {
  command: 'vip',
  description: 'Set VIP role',
  parameters: ['role name'],
  rank: 3,
  execute: function (msg, params) {
    let fullParam = params.join(' ')
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''
    let role = msg.guild.roles.find(r => r.name === fullParam)
    if (role) {
      if (role !== client.vip) {
        client.vip = role.id
        db.updateGuilds(client)
        str = 'VIP set!'
        return {promise: msg.reply(str), content: str}
      } else {
        str = 'VIP is already set to that role!'
        return {promise: msg.reply(str), content: str}
      }
    } else {
      str = `Could not find role "${fullParam}"`
      return {promise: msg.reply(str), content: str}
    }
  }
}
