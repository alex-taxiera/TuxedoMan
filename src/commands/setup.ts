import { CommandResults } from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'
import { vip as permission } from '@tuxedoman/permissions'

export default new GuildCommand({
  name: 'setup',
  description: 'Setup default roles.',
  options: {
    permission,
  },
  run: async (bot, { msg }): Promise<CommandResults> => {
    return await bot.gm.setupMiscRoles(bot, msg.channel.guild)
      .then(() =>
        'Setup complete! Make sure the roles are in the order you prefer :)',
      )
  },
})
