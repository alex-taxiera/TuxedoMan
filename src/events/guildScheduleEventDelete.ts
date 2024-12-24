import { queueDeleteEventRole } from '@event-manager'
import type { GuildScheduledEvent } from '@alex-taxiera/eris'
import { DiscordEvent } from 'eris-boiler'
import * as logger from '@util/logger'
import db from '@util/db'

export default new DiscordEvent({
  name: 'guildScheduledEventDelete',
  run: async (bot, event: GuildScheduledEvent): Promise<void> => {
    const settings = await db("guild")
      .where("id", event.guild.id)
      .first();

    if (settings?.events) {
      queueDeleteEventRole(bot, event).catch(logger.error)
    }
  },
})
