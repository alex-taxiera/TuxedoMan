import { DiscordEvent } from 'eris-boiler'
import { TuxedoMan } from '../modules/tuxedoman'

export default new DiscordEvent<TuxedoMan>({
  name: 'ready',
  run: (bot): void => {
    bot.gm.startup(bot)
  }
})
