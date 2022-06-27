import { addUserToEventRole } from '@event-manager'
import {
  PossiblyUncachedGuildScheduledEvent,
  User,
  Uncached,
} from '@alex-taxiera/eris'
import { DiscordEvent } from 'eris-boiler'
import * as logger from '@util/logger'

export default new DiscordEvent({
  name: 'guildScheduledEventUserAdd',
  run: async (
    bot,
    event: PossiblyUncachedGuildScheduledEvent,
    user: User | Uncached,
  ): Promise<void> => {
    const settings = await bot.dbm.newQuery('guild').get(event.guild.id)

    if (settings?.get('events')) {
      addUserToEventRole(
        bot,
        event.guild.id,
        user.id,
        event.id,
      ).catch(logger.error)
    }
  },
})
