import {
  Presence,
  Member,
} from '@alex-taxiera/eris'
import * as logger from '@util/logger'

import { DiscordEvent } from 'eris-boiler'
import { computeActivity } from '@util/activity'
import { checkMember } from '@game-manager'

export default new DiscordEvent({
  name: 'presenceUpdate',
  run: (bot, member: Member, oldPresence: Presence): void => {
    if (member.bot) {
      return
    }

    const oldActivity = computeActivity(oldPresence)
    const newActivity = computeActivity(member)

    if (oldActivity?.name !== newActivity?.name) {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      if (member.joinedAt == null || member.joinedAt > fiveMinutesAgo) {
        logger.info(
          `Member ${member.id} joined less than 5 minutes ago, delaying check`,
        )
        setTimeout(
          async () => {
            const updatedMember = await bot.getRESTGuildMember(
              member.guild.id,
              member.id,
            )
            checkMember(bot, updatedMember, newActivity).catch(logger.error)
          },
          5 * 60 * 1000,
        )
        return
      }

      checkMember(bot, member, newActivity).catch(logger.error)
    }
  },
})
