import { Presence, Member } from 'eris'
import { DiscordEvent } from '@tuxedoman'

export default new DiscordEvent({
  name: 'presenceUpdate',
  run: (bot, member: Member, oldPresence: Presence): void => {
    bot.gm.checkMember(bot, member, oldPresence)
  }
})
