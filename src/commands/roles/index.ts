import { getRolesForGuild } from '@game-manager'
import {
  CommandResults,
  GuildCommand,
} from 'eris-boiler'

import inspect from './inspect'

export default new GuildCommand({
  name: 'roles',
  description: 'List tracked roles.',
  options: {
    subCommands: [ inspect ],
  },
  run: async (bot, { msg }): Promise<CommandResults> => {
    const { trackedRoles } = await getRolesForGuild(
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
