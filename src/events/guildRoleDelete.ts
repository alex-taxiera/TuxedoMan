import { Guild, Role } from 'eris'
import { DiscordEvent } from '@tuxedoman'

export default new DiscordEvent({
  name: 'guildRoleDelete',
  run: (bot, guild: Guild, role: Role): void => {
    bot.gm.checkRole(bot, guild, role)
  }
})
