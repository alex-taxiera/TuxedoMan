import { logger } from 'eris-boiler/util'
import {
  SettingCommand,
} from '@tuxedoman'

export default new SettingCommand({
  name: 'voiceThreshold',
  description: 'Set the number of minimum players before making a voice room.',
  displayName: 'Voice Room Player Threshold',
  setting: 'voiceThreshold',
  options: {
    parameters: [
      'threshold number',
    ],
    postHook: (bot, { msg }): void => {
      bot.gm.checkVoiceForGuild(bot, msg.channel.guild).catch(logger.error)
    },
  },
  getValue: async (bot, { msg }) => {
    const dbGuild = await bot.dbm.newQuery('guild').get(msg.channel.guild.id)
    return `${dbGuild?.get('voiceChannelThreshold') as number}` ?? ''
  },
  run: async (bot, { msg, params }) => {
    const [ threshold ] = params

    const dbGuild = await bot.dbm.newQuery('guild').get(msg.channel.guild.id)

    await dbGuild?.save({ voiceThreshold: threshold })
    return 'Voice Room threshold set!'
  },
})
