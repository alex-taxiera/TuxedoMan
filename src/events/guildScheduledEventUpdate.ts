import { queueUpdateEventRole } from '@event-manager'
import { GuildScheduledEvent } from '@alex-taxiera/eris'
import { DiscordEvent } from 'eris-boiler'
import { logger } from 'eris-boiler/util'

export default new DiscordEvent({
  name: 'guildScheduledEventUpdate',
  run: async (bot, event: GuildScheduledEvent): Promise<void> => {
    const settings = await bot.dbm.newQuery('guild').get(event.guild.id)

    if (settings?.get('events')) {
      queueUpdateEventRole(bot, event)
        .catch((error: Error) => logger.error(error, error.stack))
    }
  },
})
