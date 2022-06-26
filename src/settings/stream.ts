import { checkAllMembers } from '@game-manager'
import { ToggleCommand } from 'eris-boiler'
import { logger } from 'eris-boiler/util'

export default new ToggleCommand({
  name: 'stream',
  description: 'Toggle the streaming role.',
  displayName: 'Streaming',
  setting: 'stream',
  options: {
    postHook: (bot, { msg }): void => {
      checkAllMembers(bot, msg.channel.guild)
        .catch((error: Error) => logger.error(error, error.stack))
    },
  },
})
