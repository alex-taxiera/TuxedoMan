import {
  CommandResults
} from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'

import inspect from './inspect'

export default new GuildCommand({
  name: 'roles',
  description: 'List tracked roles.',
  options: {
    subCommands: [ inspect ]
  },
  run: (bot, { channel }): CommandResults => {
    return bot.gm.getRolesForGuild(bot, channel.guild).then(({ trackedRoles }) => {
      const fields = []
      for (const dbo of trackedRoles.values()) {
        fields.push({
          name: dbo.get('game'),
          value: channel.guild.roles.get(dbo.get('role'))?.name ?? 'ERR',
          inline: true
        })
      }
      return {
        embed: {
          title: 'Tracked Roles',
          fields
        }
      }
    })
  }
})
