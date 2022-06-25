import { DiscordEvent } from '@tuxedoman'
import {
  PossiblyUncachedGuildScheduledEvent,
  User,
  Uncached,
} from 'eris'
import { logger } from 'eris-boiler/util'

export default new DiscordEvent({
  name: 'guildScheduledEventUserRemove',
  run: async (
    bot,
    event: PossiblyUncachedGuildScheduledEvent,
    user: User | Uncached,
  ): Promise<void> => {
    logger.info('guildScheduledEventUserRemove', event)
    await bot.em.removeUserFromEventRole(
      bot, event.guild.id, user.id, event.id,
    )
  },
})
