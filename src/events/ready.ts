import { DiscordEvent } from '@tuxedoman'

export default new DiscordEvent({
  name: 'ready',
  run: (bot): void => {
    bot.gm.startup(bot)
  }
})
