import { logger } from 'eris-boiler/util'
import {
  SettingCommand,
} from '@tuxedoman'

export default new SettingCommand({
  name: 'voiceCategory',
  description: 'Set the category to create voice channels under.',
  displayName: 'Voice Room Channel Category',
  setting: 'voiceCategory',
  options: {
    parameters: [
      'category channel name/id/mention',
    ],
    postHook: (bot, { msg }): void => {
      bot.gm.checkVoiceForGuild(bot, msg.channel.guild).catch(logger.error)
    },
  },
  getValue: async (bot, { msg }) => {
    const dbGuild = await bot.dbm.newQuery('guild').get(msg.channel.guild.id)
    const channelId = dbGuild?.get('voiceChannelCategory') as string ?? ''
    if (!channelId) {
      return 'None'
    }

    return `#${channelId}`
  },
  run: async (bot, { msg, params }) => {
    const [ channelId ] = params
    const fullParam = params.join(' ')

    const guild = msg.channel.guild
    const channel = guild.channels.get(channelId) ||
      guild.channels.find((c) => c.name === fullParam)

    if (!channel) {
      return `Could not find channel "${fullParam}"`
    } else if (channel.type !== 4) {
      return `Channel "${fullParam}" is not a category`
    }

    const dbGuild = await bot.dbm.newQuery('guild').get(guild.id)
    if (channel.id === dbGuild?.get('voiceChannelCategory')) {
      return 'Voice Category is already set to that channel!'
    }

    await dbGuild?.save({ voiceChannelCategory: channel.id })
    return 'Voice Room Category set!'
  },
})
