import { handleStartup } from '@event-manager'
import {
  checkAllRoles,
  checkAllMembers,
} from '@game-manager'
import { DiscordEvent } from 'eris-boiler'
import { logger } from 'eris-boiler/util'

export default new DiscordEvent({
  name: 'ready',
  run: async (bot): Promise<void> => {
    await Promise.all([
      ...bot.guilds.map(async (guild) => {
        await checkAllRoles(bot, guild)
        await checkAllMembers(bot, guild)
      }),
      handleStartup(bot),
    ]).catch((error: Error) => logger.error(error, error.stack))
  },
})
