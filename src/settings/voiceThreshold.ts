import {
  SettingCommand,
  TuxedoMan,
} from '@tuxedoman'
import {
  DISPLAY_NAME,
  getValue,
  SETTING,
  SETTING_DESCRIPTION,
  SETTING_PARAMS,
  setValue,
} from '@voice-settings/threshold'

export default new SettingCommand({
  name: SETTING,
  description: SETTING_DESCRIPTION,
  displayName: DISPLAY_NAME,
  setting: SETTING,
  options: {
    parameters: SETTING_PARAMS,
    // eslint-disable-next-line @typescript-eslint/unbound-method
    postHook: TuxedoMan.checkVoicePostHook,
  },
  getValue: async (bot, { msg }) => {
    const dbGuild = await bot.dbm.newQuery('guild').get(msg.channel.guild.id)
    return getValue(dbGuild?.toJSON())
  },
  run: async (bot, { msg, params }) => {
    const dbGuild = await bot.dbm.newQuery('guild').get(msg.channel.guild.id)
    return setValue(params, dbGuild!)
  },
})
