import { checkAllMembers } from '@game-manager'
import { ToggleCommand } from 'eris-boiler'
import * as logger from '@util/logger'

export default new ToggleCommand({
  name: 'stream',
  description: 'Toggle the streaming role.',
  displayName: 'Streaming',
  setting: 'stream',
  options: {
    postHook: (bot, { msg }): void => {
      checkAllMembers(bot, msg.channel.guild).catch(logger.error)
    },
  },
})
