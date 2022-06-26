import {
  Guild,
  Role,
} from '@alex-taxiera/eris'
import { logger } from 'eris-boiler/util'

import { DiscordEvent } from 'eris-boiler'
import { checkRole } from '@game-manager'
import { handleEventRoleDeleted } from '@event-manager'

export default new DiscordEvent({
  name: 'guildRoleDelete',
  run: (bot, guild: Guild, role: Role): void => {
    Promise.all([
      checkRole(bot, guild, role),
      handleEventRoleDeleted(bot, guild, role),
    ]).catch((error: Error) => logger.error(error, error.stack))
  },
})
