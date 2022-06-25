import { logger } from 'eris-boiler/util'
import { ToggleCommand } from '@tuxedoman'

export default new ToggleCommand({
  name: 'listen',
  description: 'Toggle the listening role.',
  displayName: 'Listening',
  setting: 'listen',
  options: {
    postHook: (bot, { msg }): void => {
      bot.gm.checkAllMembers(bot, msg.channel.guild)
        .catch((error: Error) => logger.error(error, error.stack))
    },
  },
})
