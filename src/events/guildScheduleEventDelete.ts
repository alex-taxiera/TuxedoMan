import { DiscordEvent } from '@tuxedoman'
import { GuildScheduledEvent } from 'eris'
import { logger } from 'eris-boiler/util'

export default new DiscordEvent({
  name: 'guildScheduledEventDelete',
  run: async (bot, event: GuildScheduledEvent): Promise<void> => {
    logger.info('guildScheduledEventDelete', event)
    await bot.em.deleteEventRole(bot, event)
  },
})
