import {
  CommandResults,
} from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'
import GameManager from '@game-manager'

export default new GuildCommand({
  name: 'inspect',
  description: 'Get details about a specific tracked role.',
  options: {
    parameters: [ '<roleId>' ],
  },
  run: (bot, { msg, params }): Promise<CommandResults> | CommandResults => {
    const roleId = params[0]
    const role = msg.channel.guild.roles.get(roleId)

    if (!role) {
      return 'No role found for ID.'
    }

    return bot.gm.getGameRolesByRoleID(bot, roleId).then((gameRoles) => {
      if (!gameRoles.length) {
        return 'Role not being tracked.'
      }

      let description = 'Games:\n'
      for (const dbo of gameRoles) {
        description += `${dbo.get('game') as string}\n`
      }
      return {
        embed: {
          title: `Role Info: '${role.name}' (${role.id})`,
          description,
          fields: [
            {
              name: 'Members with this Role',
              value: GameManager.countMembersWithRole(
                [ ...msg.channel.guild.members.values() ],
                roleId,
              ).toString(),
            },
          ],
        },
      }
    })
  },
})
