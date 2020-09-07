import {
  CommandResults,
} from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'

import inspect from './inspect'

export default new GuildCommand({
  name: 'roles',
  description: 'List tracked roles.',
  options: {
    subCommands: [ inspect ],
  },
  run: (bot, { msg }): Promise<CommandResults> => {
    return bot.gm.getRolesForGuild(bot, msg.channel.guild)
      .then(({ trackedRoles }) => {
        const fields = []
        for (const dbo of trackedRoles.values()) {
          fields.push({
            name: dbo.get('game') as string,
            value: msg.channel.guild.roles.get(dbo.get('role'))?.name ?? 'ERR',
            inline: true,
          })
        }
        return {
          embed: {
            title: 'Tracked Roles',
            fields,
          },
        }
      })
  },
})
