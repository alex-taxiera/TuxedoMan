import { checkAllMembers } from '@game-manager'
import { ToggleCommand } from 'eris-boiler'
import * as logger from '@util/logger'

export default new ToggleCommand({
  name: 'watch',
  description: 'Toggle the watching role.',
  displayName: 'Watching',
  setting: 'watch',
  options: {
    postHook: (bot, { msg }): void => {
      checkAllMembers(bot, msg.channel.guild).catch(logger.error)
    },
  },
})
