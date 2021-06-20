import {
  SettingCommand,
  TuxedoMan,
} from '@tuxedoman'
import {
  getValue,
  setValue,
  SETTING_DESCRIPTION,
  DISPLAY_NAME,
  SETTING_PARAMS,
  SETTING,
} from '@voice-settings/category'

export default new SettingCommand({
  name: 'voiceCategory',
  description: SETTING_DESCRIPTION,
  displayName: DISPLAY_NAME,
  setting: SETTING,
  options: {
    parameters: SETTING_PARAMS,
    postHook: (bot, context) =>
      TuxedoMan.checkVoicePostHook(bot, context),
  },
  getValue: async (bot, { msg }) => {
    const dbGuild = await bot.dbm.newQuery('guild').get(msg.channel.guild.id)
    return getValue(msg.channel.guild, dbGuild?.toJSON())
  },
  run: async (bot, { msg, params }) => {
    const guild = msg.channel.guild
    const dbGuild = await bot.dbm.newQuery('guild').get(guild.id)

    return setValue(guild, params, dbGuild!)
  },
})
