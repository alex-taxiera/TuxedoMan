import { logger } from 'eris-boiler/util'
import {
  SettingCommand,
} from '@tuxedoman'
import {
  getValue,
  setValue,
  SETTING_DESCRIPTION,
  DISPLAY_NAME,
  SETTING_PARAMS,
} from '@voice-settings/voiceCategory'

export default new SettingCommand({
  name: 'voiceCategory',
  description: SETTING_DESCRIPTION,
  displayName: DISPLAY_NAME,
  setting: 'voiceCategory',
  options: {
    parameters: SETTING_PARAMS,
    postHook: (bot, { msg }): void => {
      bot.gm.checkVoiceForGuild(bot, msg.channel.guild).catch(logger.error)
    },
  },
  getValue: async (bot, { msg }) => {
    const dbGuild = await bot.dbm.newQuery('guild').get(msg.channel.guild.id)
    return getValue(dbGuild?.toJSON())
  },
  run: async (bot, { msg, params }) => {
    const guild = msg.channel.guild
    const dbGuild = await bot.dbm.newQuery('guild').get(guild.id)

    return setValue(guild, params, dbGuild)
  },
})
