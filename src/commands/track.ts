import { GuildChannel } from 'eris'
import { Command, CommandResults } from 'eris-boiler'
import { TuxedoMan } from '../modules/tuxedoman'
import { vip as permission } from '../modules/tuxedoman/permissions'

export default new Command<TuxedoMan>({
  name: 'track',
  description: 'Track a game with a game role',
  options: {
    parameters: [ 'game name as appears on discord statuses' ],
    permission
  },
  run: function (bot, { msg, params }): CommandResults {
    const [ gameName, ...rest ] = params
    if (rest.length > 100) {
      return 'Name is too long!'
    }
    return bot.gm.trackGame(
      bot,
      (msg.channel as GuildChannel).guild,
      rest.join(' '),
      gameName
    )
  }
})
