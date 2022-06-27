import { queueDeleteEventRole } from '@event-manager'
import { GuildScheduledEvent } from '@alex-taxiera/eris'
import { DiscordEvent } from 'eris-boiler'
import * as logger from '@util/logger'

export default new DiscordEvent({
  name: 'guildScheduledEventDelete',
  run: async (bot, event: GuildScheduledEvent): Promise<void> => {
    const settings = await bot.dbm.newQuery('guild').get(event.guild.id)

    if (settings?.get('events')) {
      queueDeleteEventRole(bot, event).catch(logger.error)
    }
  },
})
