import { DiscordEvent } from '@tuxedoman'
import { Guild } from 'eris'

export default new DiscordEvent({
  name: 'guildCreate',
  run: (bot, guild: Guild): void => {
    bot.gm.checkAllMembers(bot, guild)
  }
})
