import {
  Guild
} from 'eris'
import {
  CommandResults
} from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'

export default new GuildCommand({
  name: 'inspect',
  description: 'Get details about a specific tracked role.',
  options: {
    parameters: [ '<roleId>' ]
  },
  run: (bot, { channel, params }): CommandResults => {
    const roleId = params[0]
    const role = channel.guild.roles.get(roleId)

    if (!role) {
      return 'No role found for ID.'
    }

    return bot.gm.getGameRolesByRoleID(bot, roleId).then((gameRoles) => {
      if (!gameRoles.length) {
        return 'Role not being tracked.'
      }

      let description = 'Games:\n'
      for (const dbo of gameRoles) {
        description += `${dbo.get('game')}\n`
      }
      return {
        embed: {
          title: `Role Info: '${role.name}' (${role.id})`,
          description,
          fields: [
            {
              name: 'Members with this Role',
              value: getCount(channel.guild, roleId),
              inline: true
            }
          ]
        }
      }
    })
  }
})

function getCount (guild: Guild, roleId: string): string {
  return guild.members.reduce((ax, dx) => {
    if (dx.roles.includes(roleId)) {
      ax++
    }

    return ax
  }, 0).toString()
}
