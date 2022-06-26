import { logger } from 'eris-boiler/util'
import { ToggleCommand } from 'eris-boiler'
import {
  handleGuildCreate,
  deleteAllEventRolesForGuild,
} from '@event-manager'

export default new ToggleCommand({
  name: 'events',
  description: 'Toggle the Scheduled Event manager.',
  displayName: 'Event Roles',
  setting: 'events',
  options: {
    postHook: async (bot, { msg }): Promise<void> => {
      const settings = await bot.dbm.newQuery('guild').get(msg.guildID)
      if (settings?.get('events')) {
        handleGuildCreate(bot, msg.guildID)
          .catch((error: Error) => logger.error(error, error.stack))
      } else {
        deleteAllEventRolesForGuild(bot, msg.guildID)
          .catch((error: Error) => logger.error(error, error.stack))
      }
    },
  },
})
