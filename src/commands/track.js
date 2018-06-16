const Command = require('../classes/Command.js')

module.exports = (bot) => new Command(
  bot,
  {
    name: 'track',
    description: 'Track a game with a game role',
    options: {
      parameters: ['game name as appears on discord statuses'],
      permission: 'VIP'
    },
    run: async function ({ bot, msg, params }) {
      const fullParam = params.join(' ')
      if (fullParam.length > 100) return 'Role name is too long!'
      return bot.gm.trackGame(bot, msg.channel.guild, fullParam)
    }
  }
)
