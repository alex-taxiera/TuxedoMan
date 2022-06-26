import { queueUpdateEventRole } from '@event-manager'
import { GuildScheduledEvent } from '@alex-taxiera/eris'
import { DiscordEvent } from 'eris-boiler'
import { logger } from 'eris-boiler/util'

export default new DiscordEvent({
  name: 'guildScheduledEventUpdate',
  run: (bot, event: GuildScheduledEvent): void => {
    queueUpdateEventRole(bot, event)
      .catch((error: Error) => logger.error(error, error.stack))
  },
})
