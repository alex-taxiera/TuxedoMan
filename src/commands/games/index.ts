import {
  CommandResults
} from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'

import inspect from './inspect'

export default new GuildCommand({
  name: 'games',
  description: 'List tracked games.',
  options: {
    subCommands: [ inspect ]
  },
  run: (bot, { msg }): CommandResults => {
    return bot.gm.getRolesForGuild(bot, msg.channel.guild)
      .then(({ trackedRoles }) => {
        const fields = []
        for (const dbo of trackedRoles.values()) {
          fields.push({
            name: dbo.get('game'),
            value: msg.channel.guild.roles.get(dbo.get('role'))?.name ?? 'ERR',
            inline: true
          })
        }
        return {
          embed: {
            title: 'Tracked Games',
            fields
          }
        }
      })
  }
})
