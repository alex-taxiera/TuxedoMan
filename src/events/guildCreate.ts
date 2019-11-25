import { DiscordEvent } from 'eris-boiler'
import TuxedoMan from '../modules/tuxedoman'
import { Guild } from 'eris'

export default new DiscordEvent<TuxedoMan>({
  name: 'guildCreate',
  run: (bot, guild: Guild): void => {
    bot.gm.checkAllMembers(bot, guild)
  }
})
