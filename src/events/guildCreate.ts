import { Guild } from 'eris'
import { logger } from 'eris-boiler/util'

import { DiscordEvent } from '@tuxedoman'

export default new DiscordEvent({
  name: 'guildCreate',
  run: (bot, guild: Guild): void => {
    bot.gm.checkAllMembers(bot, guild)
      .catch((error: Error) => logger.error(error, error.stack))
  },
})
