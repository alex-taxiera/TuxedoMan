import { DiscordEvent } from '@tuxedoman'
import { logger } from 'eris-boiler/util'

export default new DiscordEvent({
  name: 'ready',
  run: async (bot): Promise<void> => {
    await Promise.all(
      bot.guilds.map(async (guild) => {
        await bot.gm.checkAllRoles(bot, guild)
        await bot.gm.checkAllMembers(bot, guild)
      }),
    ).catch((error: Error) => logger.error(error, error.stack))
  },
})
