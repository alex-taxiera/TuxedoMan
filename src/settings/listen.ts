import {
  ToggleCommand
} from '@tuxedoman'

export default new ToggleCommand({
  name: 'listen',
  description: 'Toggle the listening role.',
  displayName: 'Listening',
  setting: 'listen',
  options: {
    postHook: (bot, { channel }): void => {
      bot.gm.checkAllMembers(bot, channel.guild)
    }
  }
})
