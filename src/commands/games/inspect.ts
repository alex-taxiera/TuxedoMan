import {
  Guild,
} from 'eris'
import {
  CommandResults,
} from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'

const getCount = (guild: Guild, roleId: string): string => {
  return guild.members.reduce((ax, dx) => {
    if (dx.roles.includes(roleId)) {
      ax++
    }

    return ax
  }, 0).toString()
}

export default new GuildCommand({
  name: 'inspect',
  description: 'Get details about a specific tracked game.',
  options: {
    parameters: [ '<game name>' ],
  },
  run: (bot, { msg, params }): Promise<CommandResults> => {
    const gameName = params[0]

    return bot.gm.getGameRoleByGameName(bot, gameName).then(([ gameRole ]) => {
      if (!gameRole) {
        return 'Game not being tracked.'
      }

      const roleName = gameRole.get('role') as string
      const roleId = gameRole.get('id') as string

      return {
        embed: {
          title: `Game Info: '${gameName}'`,
          fields: [
            {
              name: 'Members playing this Game',
              value: getCount(msg.channel.guild, roleId),
              inline: true,
            },
            {
              name: 'Role for Game',
              value: `'${roleName}' (${roleId})`,
            },
          ],
        },
      }
    })
  },
})
