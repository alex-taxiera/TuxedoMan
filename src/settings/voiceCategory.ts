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
    const guild = msg.channel.guild
    const dbGuild = await bot.dbm.newQuery('guild').get(guild.id)

    return setValue(guild, params, dbGuild!)
  },
})
