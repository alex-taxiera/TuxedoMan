import { OldPresence, Member } from 'eris'
import { DiscordEvent } from '@tuxedoman'

export default new DiscordEvent({
  name: 'presenceUpdate',
  run: (bot, member: Member, oldPresence: OldPresence): void => {
    bot.gm.checkMember(bot, member, oldPresence)
  }
})
