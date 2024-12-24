import {
  queueDeleteEventRole,
  queueUpdateEventRole,
} from '@event-manager'
import {
  type GuildScheduledEvent,
  Constants,
} from '@alex-taxiera/eris'
import { DiscordEvent } from 'eris-boiler'
import * as logger from '@util/logger'
import db from '@util/db'

export default new DiscordEvent({
  name: 'guildScheduledEventUpdate',
  run: async (bot, event: GuildScheduledEvent): Promise<void> => {
    const settings = await db("guild")
      .where("id", event.guild.id)
      .first();

    if (settings?.events) {
      if (event.status === Constants.GuildScheduledEventStatus.COMPLETED) {
        queueDeleteEventRole(bot, event).catch(logger.error)
      } else {
        queueUpdateEventRole(bot, event).catch(logger.error)
      }
    }
  },
})
