import {
  Guild
} from 'eris'
import {
  CommandResults
} from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'

export default new GuildCommand({
  name: 'inspect',
  description: 'Get details about a specific tracked game.',
  options: {
    parameters: [ '<game name>' ]
  },
  run: (bot, { channel, params }): CommandResults => {
    const gameName = params[0]

    return bot.gm.getGameRoleByGameName(bot, gameName).then(([ gameRole ]) => {
      if (!gameRole) {
        return 'Game not being tracked.'
      }

      const role = gameRole.get('role')

      return {
        embed: {
          title: `Game Info: '${gameName}'`,
          fields: [
            {
              name: 'Members playing this Game',
              value: getCount(channel.guild, role.id),
              inline: true
            },
            {
              name: 'Role for Game',
              value: `'${role.name}' (${role.id})`
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
