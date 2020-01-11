import {
  ToggleCommand
} from '@tuxedoman'

export default new ToggleCommand({
  name: 'stream',
  description: 'Toggle the streaming role.',
  displayName: 'Streaming',
  setting: 'stream',
  options: {
    postHook: (bot, { channel }): void => {
      bot.gm.checkAllMembers(bot, channel.guild)
    }
  }
})
