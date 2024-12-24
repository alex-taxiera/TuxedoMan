import { hasRolePermission } from '@discord/roles'
import { setupMiscRoles } from '@game-manager'
import {
  CommandResults,
  GuildCommand,
} from 'eris-boiler'
import { vip as permission } from 'eris-boiler/permissions'

export default new GuildCommand({
  name: 'setup',
  description: 'Setup default roles.',
  options: {
    permission,
  },
  run: async (bot, { msg }): Promise<CommandResults> => {
    if (!hasRolePermission(bot, msg.channel.guild.id)) {
      return 'I need the `Manage Roles` permission to do this!'
    }
    await setupMiscRoles(bot, msg.channel.guild)

    return 'Setup complete! Make sure the roles are in the order you prefer :)'
  },
})
