import { DiscordEvent } from '@tuxedoman'
import { GuildScheduledEvent } from 'eris'
import { logger } from 'eris-boiler/util'

export default new DiscordEvent({
  name: 'guildScheduledEventCreate',
  run: async (bot, event: GuildScheduledEvent): Promise<void> => {
    logger.info('guildScheduledEventCreate', event)
    await bot.em.createEventRole(bot, event)
    logger.info('finished creating')
  },
})
