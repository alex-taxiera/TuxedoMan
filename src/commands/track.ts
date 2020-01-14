import { CommandResults } from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'
import { vip as permission } from '@tuxedoman/permissions'

export default new GuildCommand({
  name: 'track',
  description: 'Track a game with a game role',
  options: {
    permission,
    parameters: [
      '<game name> (as appears on discord statuses)',
      '[role name] (defaults to game name)'
    ]
  },
  run: (bot, { params, channel }): CommandResults => {
    const [ gameName, ...rest ] = params
    const roleName = rest.length ? rest.join(' ') : gameName
    if (roleName.length > 100) {
      return 'Name is too long!'
    }
    return bot.gm.trackGame(bot, channel.guild, roleName, gameName)
  }
})
