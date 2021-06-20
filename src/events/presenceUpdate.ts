import {
  Presence,
  Member,
} from 'eris'
import { logger } from 'eris-boiler/util'

import { DiscordEvent } from '@tuxedoman'
import {
  computeActivity,
} from '@util/activity'

export default new DiscordEvent({
  name: 'presenceUpdate',
  run: (bot, member: Member, oldPresence: Presence): void => {
    const oldActivity = computeActivity(oldPresence)
    const newActivity = computeActivity(member)

    if (oldActivity?.name !== newActivity?.name) {
      bot.gm.checkMember(bot, member, newActivity, true)
        .catch((error: Error) => logger.error(error, error.stack))
    }
  },
})
