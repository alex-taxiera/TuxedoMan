import { CommandResults } from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'
import { countMembersWithRole } from '@discord/roles'

export default new GuildCommand({
  name: 'inspect',
  description: 'Get details about a specific tracked role.',
  options: {
    parameters: [ '<roleId/roleName>' ],
  },
  run: async (bot, { msg, params }): Promise<CommandResults> => {
    const roleId = params[0]
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const role = msg.channel.guild.roles.get(roleId!) ??
      msg.channel.guild.roles.find((role) => role.name === roleId)

    if (!role) {
      return 'Role not found.'
    }

    const gameRole = await bot.gm.getGameRoleByRoleId(
      bot,
      msg.channel.guild.id,
      role.id,
    )
    if (!gameRole) {
      return 'Role not being tracked.'
    }

    return {
      embed: {
        title: `Role Info: '${role.name}' (${role.id})`,
        fields: [
          {
            name: 'Games',
            value: gameRole.games.join('\n'),
          },
          {
            name: 'Members with this Role',
            value: countMembersWithRole(
              msg.channel.guild.members,
              role.id,
            ).toString(),
          },
          {
            name: '\u200b',
            value: '**--Settings--**',
          },
        ],
      },
    }
  },
})
