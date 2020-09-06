import {
  Presence,
  Member,
} from 'eris'
import { logger } from 'eris-boiler/util'

import { DiscordEvent } from '@tuxedoman'
import { activitiesAreEqual } from '@util/activity'

export default new DiscordEvent({
  name: 'presenceUpdate',
  run: (bot, member: Member, oldPresence: Presence): void => {
    if (!activitiesAreEqual([
      member.activities ?? [],
      oldPresence?.activities ?? [],
    ])) {
      bot.gm.checkMember(bot, member, true).catch(logger.error)
    }
  },
})
