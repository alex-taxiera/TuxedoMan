import {
  ToggleCommand
} from '@tuxedoman'

export default new ToggleCommand({
  name: 'watch',
  description: 'Toggle the watching role.',
  displayName: 'Watching',
  setting: 'watch',
  options: {
    postHook: (bot, { channel }): void => {
      bot.gm.checkAllMembers(bot, channel.guild)
    }
  }
})
