import { DiscordEvent } from '@tuxedoman'
import {
  PossiblyUncachedGuildScheduledEvent,
  User,
  Uncached,
} from 'eris'
import { logger } from 'eris-boiler/util'

export default new DiscordEvent({
  name: 'guildScheduledEventUserAdd',
  run: async (
    bot,
    event: PossiblyUncachedGuildScheduledEvent,
    user: User | Uncached,
  ): Promise<void> => {
    logger.info('guildScheduledEventUserAdd', event)
    try {
      await bot.em.addUserToEventRole(
        bot, event.guild.id, user.id, event.id,
      )
    } catch (e) {
      console.error(e)
    }
    logger.info('finished adding user')
  },
})
