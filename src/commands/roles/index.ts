import {
  CommandResults,
} from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'

import inspect from './inspect'
import set from './set'

export default new GuildCommand({
  name: 'roles',
  description: 'List tracked roles.',
  options: {
    subCommands: [ inspect, set ],
  },
  run: async (bot, { msg }): Promise<CommandResults> => {
    const { trackedRoles } = await bot.gm.getRolesForGuild(
      bot, msg.channel.guild,
    )
    const fields = []
    for (const tracked of trackedRoles) {
      fields.push({
        name: msg.channel.guild.roles.get(tracked.role)?.name ?? 'ERR',
        value: tracked.games.join(', '),
        inline: true,
      })
    }
    return {
      embed: {
        title: 'Tracked Roles',
        fields,
      },
    }
  },
})
