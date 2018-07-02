const Command = require('../classes/Command.js')

module.exports = (bot) => new Command(
  bot,
  {
    name: 'preferences',
    description: 'Display guild-wide options',
    options: {
      aliases: ['prefs', 'settings'],
      permission: 'VIP'
    },
    run: async function ({ msg, bot }) {
      const inline = true
      const guild = msg.channel.guild
      const { vip, prefix } = await bot.dbm.getSettings(guild.id)
      const { game, watch, listen, stream } = await bot.dbm.getToggles(guild.id)

      const trackedRoles = await bot.gm.getTrackedRoles(bot, guild.id)
      const trackedGames = trackedRoles.length > 0
        ? trackedRoles.map((id) => guild.roles.has(id) ? guild.roles.get(id).name : null).join('\n')
        : 'None'

      const vipRole = bot.guilds.get(guild.id).roles.get(vip)
      const embed = {
        description: ':heartbeat: [**Preferences**](https://github.com/alex-taxiera/TuxedoMan)',
        thumbnail: { url: bot.user.avatarURL },
        timestamp: require('moment'),
        color: 0x3498db,
        footer: {
          icon_url: bot.user.avatarURL,
          text: 'TuxedoMan'
        },
        fields: [
          { name: 'Prefix', value: prefix, inline },
          { name: 'VIP Role', value: vip ? vipRole.name : 'None', inline },
          { name: 'Display Other Games', value: game ? 'Enabled' : 'Disabled', inline },
          { name: 'Display Watching', value: watch ? 'Enabled' : 'Disabled', inline },
          { name: 'Display Listening', value: listen ? 'Enabled' : 'Disabled', inline },
          { name: 'Display Streaming', value: stream ? 'Enabled' : 'Disabled', inline },
          { name: 'Tracked Games', value: trackedGames }
        ]
      }
      return { embed, delay: 15000 }
    }
  }
)
