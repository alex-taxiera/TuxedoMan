import {
  Guild,
  Role,
} from 'eris'
import { logger } from 'eris-boiler/util'

import { DiscordEvent } from '@tuxedoman'

export default new DiscordEvent({
  name: 'guildRoleDelete',
  run: (bot, guild: Guild, role: Role): void => {
    bot.gm.checkRole(bot, guild, role).catch(logger.error)
  },
})
