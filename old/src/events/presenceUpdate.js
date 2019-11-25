const { Event } = require('eris-boiler')

module.exports = new Event({
  name: 'presenceUpdate',
  run: (bot, member, old) => bot.gm.checkMember(bot, member, old.game)
})
