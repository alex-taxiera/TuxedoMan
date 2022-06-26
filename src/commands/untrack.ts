import {
  getGameByName,
  removeTrackedGame,
} from '@game-manager'
import {
  CommandResults,
  GuildCommand,
} from 'eris-boiler'
import { vip as permission } from 'eris-boiler/permissions'

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

    const game = await getGameByName(bot, guild.id, gameName)
    if (!game) {
      return 'Not found in tracking list!'
    }

    await removeTrackedGame(bot, guild, gameName)

    return 'Untracked!'
  },
})
