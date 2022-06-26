import { queueDeleteEventRole } from '@event-manager'
import { GuildScheduledEvent } from '@alex-taxiera/eris'
import { DiscordEvent } from 'eris-boiler'
import { logger } from 'eris-boiler/util'

export default new DiscordEvent({
  name: 'guildScheduledEventDelete',
  run: async (bot, event: GuildScheduledEvent): Promise<void> => {
    const settings = await bot.dbm.newQuery('guild').get(event.guild.id)

    if (settings?.get('events')) {
      queueDeleteEventRole(bot, event)
        .catch((error: Error) => logger.error(error, error.stack))
    }
  },
})
