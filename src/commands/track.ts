import {
  getGameByName,
  addTrackedGame,
} from '@game-manager'
import {
  CommandResults,
  GuildCommand,
} from 'eris-boiler'
import { vip as permission } from 'eris-boiler/permissions'

export default new GuildCommand({
  name: 'track',
  description: 'Track a game with a game role',
  options: {
    permission,
    parameters: [
      // eslint-disable-next-line max-len
      '<game name> (as appears on discord statuses), [role name] (defaults to game name)',
    ],
  },
  run: async (bot, { params, msg }): Promise<CommandResults> => {
    const [ gameName, ...rest ] = params
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const gameNameNonNull = gameName!
    const roleName = rest.length > 0 ? rest.join(' ') : gameNameNonNull
    if (roleName.length > 100) {
      return 'Role name is too long!'
    }
    const guild = msg.channel.guild

    const game = await getGameByName(bot, guild.id, gameNameNonNull)
    if (game) {
      return 'Game already exists in tracking list!'
    }

    await addTrackedGame(bot, guild, gameNameNonNull, roleName)
    return 'Done, make sure the role is ordered how you like!'
  },
})
