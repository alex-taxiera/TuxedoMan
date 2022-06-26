import { checkAllMembers } from '@game-manager'
import { ToggleCommand } from 'eris-boiler'
import { logger } from 'eris-boiler/util'

export default new ToggleCommand({
  name: 'watch',
  description: 'Toggle the watching role.',
  displayName: 'Watching',
  setting: 'watch',
  options: {
    postHook: (bot, { msg }): void => {
      checkAllMembers(bot, msg.channel.guild)
        .catch((error: Error) => logger.error(error, error.stack))
    },
  },
})
