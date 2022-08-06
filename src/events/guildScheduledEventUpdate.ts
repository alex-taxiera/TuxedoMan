import {
  queueDeleteEventRole,
  queueUpdateEventRole,
} from '@event-manager'
import {
  GuildScheduledEvent,
  Constants,
} from '@alex-taxiera/eris'
import { DiscordEvent } from 'eris-boiler'
import * as logger from '@util/logger'

export default new DiscordEvent({
  name: 'guildScheduledEventUpdate',
  run: async (bot, event: GuildScheduledEvent): Promise<void> => {
    const settings = await bot.dbm.newQuery('guild').get(event.guild.id)

    if (settings?.get('events')) {
      if (event.status === Constants.GuildScheduledEventStatus.COMPLETED) {
        queueDeleteEventRole(bot, event).catch(logger.error)
      } else {
        queueUpdateEventRole(bot, event).catch(logger.error)
      }
    }
  },
})
