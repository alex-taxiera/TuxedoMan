import {
  CommandResults
} from 'eris-boiler'
import { GuildCommand, permissions } from '../modules/tuxedoman'

export default new GuildCommand({
  name: 'setup',
  description: 'Setup default roles.',
  options: {
    permission: permissions.vip
  },
  run: (bot, { channel }): Promise<CommandResults> => {
    return bot.gm.setupMiscRoles(bot, channel.guild)
      .then(() =>
        'Setup complete! Make sure the roles are in the order you prefer :)'
      )
  }
})
