import { DiscordEvent } from '@tuxedoman'
import { logger } from 'eris-boiler/util'

export default new DiscordEvent({
  name: 'ready',
  run: (bot): void => {
    bot.gm.startup(bot).catch(logger.error)
  }
})
