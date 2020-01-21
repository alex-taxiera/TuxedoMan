import {
  ToggleCommand
} from '@tuxedoman'

export default new ToggleCommand({
  name: 'stream',
  description: 'Toggle the streaming role.',
  displayName: 'Streaming',
  setting: 'stream',
  options: {
    postHook: (bot, { msg }): void => {
      bot.gm.checkAllMembers(bot, msg.channel.guild)
    }
  }
})
