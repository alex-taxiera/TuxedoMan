import { queueDeleteEventRole } from '@event-manager'
import { GuildScheduledEvent } from 'eris'
import { DiscordEvent } from 'eris-boiler'
import { logger } from 'eris-boiler/util'

export default new DiscordEvent({
  name: 'guildScheduledEventDelete',
  run: (bot, event: GuildScheduledEvent): void => {
    queueDeleteEventRole(bot, event)
      .catch((error: Error) => logger.error(error, error.stack))
  },
})
