import { Presence, Member } from 'eris'
import { logger } from 'eris-boiler/util'

import { DiscordEvent } from '@tuxedoman'

export default new DiscordEvent({
  name: 'presenceUpdate',
  run: (bot, member: Member, oldPresence: Presence): void => {
    bot.gm.checkMember(bot, member, oldPresence, true).catch(logger.error)
  }
})
