import { Guild } from '@alex-taxiera/eris'
import { logger } from 'eris-boiler/util'

import { DiscordEvent } from 'eris-boiler'
import { checkAllMembers } from '@game-manager'
import { handleGuildCreate } from '@event-manager'

export default new DiscordEvent({
  name: 'guildCreate',
  run: (bot, guild: Guild): void => {
    Promise.all([
      checkAllMembers(bot, guild),
      handleGuildCreate(bot, guild.id),
    ]).catch((error: Error) => logger.error(error, error.stack))
  },
})
