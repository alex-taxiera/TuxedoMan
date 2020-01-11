import { CommandResults } from 'eris-boiler'

import { GuildCommand } from '@tuxedoman'
import { vip as permission } from '@tuxedoman/permissions'

export default new GuildCommand({
  name: 'untrack',
  description: 'Untrack a game',
  options: {
    parameters: [ 'game name as appears on discord statuses' ],
    permission
  },
  run: (bot, { channel, params }): CommandResults => {
    return bot.gm.untrackGame(bot, channel.guild, params.join(' '))
  }
})
