const { Event } = require('eris-boiler')

module.exports = new Event({
  name: 'ready',
  run: (bot, guild) => {
    bot.logger.success(`Just joined "${guild.name}"`)
    for (const member of guild.members.values()) {
      bot.gm.checkMember(bot, member)
    }
  }
})
