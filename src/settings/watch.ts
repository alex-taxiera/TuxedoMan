import {
  ToggleCommand,
} from '@tuxedoman'
import { logger } from 'eris-boiler/util'

export default new ToggleCommand({
  name: 'watch',
  description: 'Toggle the watching role.',
  displayName: 'Watching',
  setting: 'watch',
  options: {
    postHook: (bot, { msg }): void => {
      bot.gm.checkAllMembers(bot, msg.channel.guild)
        .catch((error: Error) => logger.error(error, error.stack))
    },
  },
})
