const { Event } = require('eris-boiler')

module.exports = new Event({
  name: 'guildRoleDelete',
  run: async (bot, guild, role) => bot.gm.checkRole(bot, guild, role)
})
