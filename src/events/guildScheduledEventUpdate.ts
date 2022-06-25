import { DiscordEvent } from '@tuxedoman'
import { GuildScheduledEvent } from 'eris'
import { logger } from 'eris-boiler/util'

export default new DiscordEvent({
  name: 'guildScheduledEventUpdate',
  run: async (bot, event: GuildScheduledEvent): Promise<void> => {
    logger.info('guildScheduledEventUpdate', event)
    await bot.em.updateEventRole(bot, event)
  },
})
