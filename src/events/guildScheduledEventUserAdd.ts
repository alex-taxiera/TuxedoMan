import { addUserToEventRole } from '@event-manager'
import {
  PossiblyUncachedGuildScheduledEvent,
  User,
  Uncached,
} from 'eris'
import { DiscordEvent } from 'eris-boiler'
import { logger } from 'eris-boiler/util'

export default new DiscordEvent({
  name: 'guildScheduledEventUserAdd',
  run: (
    bot,
    event: PossiblyUncachedGuildScheduledEvent,
    user: User | Uncached,
  ): void => {
    addUserToEventRole(
      bot,
      event.guild.id,
      user.id,
      event.id,
    ).catch((error: Error) => logger.error(error, error.stack))
  },
})
