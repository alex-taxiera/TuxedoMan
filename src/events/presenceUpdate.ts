import {
  Presence,
  Member,
} from 'eris'
import { logger } from 'eris-boiler/util'

import { DiscordEvent } from 'eris-boiler'
import { computeActivity } from '@util/activity'
import { checkMember } from '@game-manager'

export default new DiscordEvent({
  name: 'presenceUpdate',
  run: (bot, member: Member, oldPresence: Presence): void => {
    const oldActivity = computeActivity(oldPresence)
    const newActivity = computeActivity(member)

    if (oldActivity?.name !== newActivity?.name) {
      checkMember(bot, member, newActivity)
        .catch((error: Error) => logger.error(error, error.stack))
    }
  },
})
