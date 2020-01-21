import {
  ToggleCommand
} from '@tuxedoman'

export default new ToggleCommand({
  name: 'other-games',
  description: 'Toggle the other games role.',
  displayName: 'Other Games',
  setting: 'game',
  options: {
    postHook: (bot, { msg }): void => {
      bot.gm.checkAllMembers(bot, msg.channel.guild)
    }
  }
})
