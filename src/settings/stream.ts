import {
  ToggleCommand,
} from '@tuxedoman'
import { logger } from 'eris-boiler/util'

export default new ToggleCommand({
  name: 'stream',
  description: 'Toggle the streaming role.',
  displayName: 'Streaming',
  setting: 'stream',
  options: {
    postHook: (bot, { msg }): void => {
      bot.gm.checkAllMembers(bot, msg.channel.guild).catch(logger.error)
    },
  },
})
