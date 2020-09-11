import { CommandResults } from 'eris-boiler'

import { GuildCommand } from '@tuxedoman'
import { vip as permission } from '@tuxedoman/permissions'

export default new GuildCommand({
  name: 'untrack',
  description: 'Untrack a game',
  options: {
    parameters: [ 'game name as appears on discord statuses' ],
    permission,
  },
  run: async (bot, { msg, params }): Promise<CommandResults> => {
    const gameName = params.join(' ')
    const guild = msg.channel.guild

    const game = await bot.gm.getGameByName(bot, guild.id, gameName)
    if (!game) {
      return 'Not found in tracking list!'
    }

    await bot.gm.removeTrackedGame(bot, guild, gameName)

    return 'Untracked!'
  },
})
