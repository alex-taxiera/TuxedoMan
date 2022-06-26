import { logger } from 'eris-boiler/util'
import { ToggleCommand } from 'eris-boiler'
import { checkAllMembers } from '@game-manager'

export default new ToggleCommand({
  name: 'listen',
  description: 'Toggle the listening role.',
  displayName: 'Listening',
  setting: 'listen',
  options: {
    postHook: (bot, { msg }): void => {
      checkAllMembers(bot, msg.channel.guild)
        .catch((error: Error) => logger.error(error, error.stack))
    },
  },
})
