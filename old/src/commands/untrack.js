const { Command } = require('eris-boiler')

module.exports = (bot) => new Command(
  bot,
  {
    name: 'untrack',
    description: 'Untrack a game',
    options: {
      parameters: [ 'game name as appears on discord statuses' ],
      permission: 'VIP'
    },
    run: async function ({ bot, msg, params }) {
      return bot.gm.untrackGame(bot, msg.channel.guild, params.join(' '))
    }
  }
)
