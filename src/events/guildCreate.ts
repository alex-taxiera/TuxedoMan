import { Guild } from '@alex-taxiera/eris'
import * as logger from '@util/logger'

import { DiscordEvent } from 'eris-boiler'
import { checkAllMembers } from '@game-manager'
import { handleGuildCreate } from '@event-manager'

export default new DiscordEvent({
  name: 'guildCreate',
  run: (bot, guild: Guild): void => {
    Promise.all([
      checkAllMembers(bot, guild),
      handleGuildCreate(bot, guild.id),
    ]).catch(logger.error)
  },
})
