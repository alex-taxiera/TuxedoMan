import { ToggleCommand } from '@tuxedoman'
import { logger } from 'eris-boiler/util'

export default new ToggleCommand({
  name: 'other-games',
  description: 'Toggle the other games role.',
  displayName: 'Other Games',
  setting: 'game',
  options: {
    postHook: (bot, { msg }): void => {
      bot.gm.checkAllMembers(bot, msg.channel.guild)
        .catch((error: Error) => logger.error(error, error.stack))
    },
  },
})
