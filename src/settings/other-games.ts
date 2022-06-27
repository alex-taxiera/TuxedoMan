import { checkAllMembers } from '@game-manager'
import { ToggleCommand } from 'eris-boiler'
import * as logger from '@util/logger'

export default new ToggleCommand({
  name: 'other-games',
  description: 'Toggle the other games role.',
  displayName: 'Other Games',
  setting: 'game',
  options: {
    postHook: (bot, { msg }): void => {
      checkAllMembers(bot, msg.channel.guild).catch(logger.error)
    },
  },
})
