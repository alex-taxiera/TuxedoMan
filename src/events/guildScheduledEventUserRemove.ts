import { removeUserFromEventRole } from '@event-manager'
import type {
  PossiblyUncachedGuildScheduledEvent,
  User,
  Uncached,
} from '@alex-taxiera/eris'
import { DiscordEvent } from 'eris-boiler'
import * as logger from '@util/logger'
import db from '@util/db'

export default new DiscordEvent({
  name: 'guildScheduledEventUserRemove',
  run: async (
    bot,
    event: PossiblyUncachedGuildScheduledEvent,
    user: User | Uncached,
  ): Promise<void> => {
    const settings = await db("guild")
      .where("id", event.guild.id)
      .first();

    if (settings?.events) {
      removeUserFromEventRole(
        bot,
        event.guild.id,
        user.id,
        event.id,
      ).catch(logger.error)
    }
  },
})
