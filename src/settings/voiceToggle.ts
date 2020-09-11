import { logger } from 'eris-boiler/util'
import {
  ToggleCommand,
} from '@tuxedoman'

export default new ToggleCommand({
  name: 'voice',
  description: 'Toggle the voice room management.',
  displayName: 'Voice Rooms',
  setting: 'manageVoice',
  options: {
    postHook: (bot, { msg }): void => {
      bot.gm.checkVoiceForGuild(bot, msg.channel.guild).catch(logger.error)
    },
  },
})
