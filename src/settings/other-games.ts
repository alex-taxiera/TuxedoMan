import { checkAllMembers } from '@game-manager'
import { ToggleCommand } from 'eris-boiler'
import { logger } from 'eris-boiler/util'

export default new ToggleCommand({
  name: 'other-games',
  description: 'Toggle the other games role.',
  displayName: 'Other Games',
  setting: 'game',
  options: {
    postHook: (bot, { msg }): void => {
      checkAllMembers(bot, msg.channel.guild)
        .catch((error: Error) => logger.error(error, error.stack))
    },
  },
})
