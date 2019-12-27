import { DiscordEvent } from 'eris-boiler'
import { TuxedoMan } from '../modules/tuxedoman'
import { OldPresence, Member } from 'eris'

export default new DiscordEvent<TuxedoMan>({
  name: 'presenceUpdate',
  run: (bot, member: Member, oldPresence: OldPresence): void => {
    bot.gm.checkMember(bot, member, oldPresence)
  }
})
