const { Event } = require('eris-boiler')

module.exports = new Event({
  name: 'ready',
  run: (bot) => {
    for (const guild of bot.guilds.values()) {
      for (const member of guild.members.values()) {
        bot.gm.checkMember(bot, member)
      }
    }
  }
})
