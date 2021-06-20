import {
  Member,
  VoiceChannel,
} from 'eris'
import { logger } from 'eris-boiler/util'

import { DiscordEvent } from '@tuxedoman'

export default new DiscordEvent({
  name: 'voiceChannelLeave',
  run: (bot, _: Member, oldChannel: VoiceChannel): void => {
    bot.gm.checkVoiceChannel(bot, oldChannel)
      .catch((error: Error) => logger.error(error, error.stack))
  },
})
