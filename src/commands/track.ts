import { CommandResults } from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'
import { vip as permission } from '@tuxedoman/permissions'

export default new GuildCommand({
  name: 'track',
  description: 'Track a game with a game role',
  options: {
    parameters: [ 'game name as appears on discord statuses' ],
    permission
  },
  run: (bot, { params, channel }): CommandResults => {
    const [ gameName, ...rest ] = params
    if (rest.length > 100) {
      return 'Name is too long!'
    }
    return bot.gm.trackGame(bot, channel.guild, rest.join(' '), gameName)
  }
})
