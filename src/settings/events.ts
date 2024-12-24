import * as logger from '@util/logger'
import { ToggleCommand } from 'eris-boiler'
import {
  handleGuildCreate,
  deleteAllEventRolesForGuild,
} from '@event-manager'
import db from '@util/db';

export default new ToggleCommand({
  name: 'events',
  description: 'Toggle the Scheduled Event manager.',
  displayName: 'Event Roles',
  setting: 'events',
  options: {
    postHook: async (bot, { msg }): Promise<void> => {
      const settings = await db("guild")
      .where("id", msg.guildID)
      .first();
      if (settings?.events) {
        handleGuildCreate(bot, msg.guildID).catch(logger.error)
      } else {
        deleteAllEventRolesForGuild(bot, msg.guildID).catch(logger.error)
      }
    },
  },
})
