import {
  SettingCommand,
  TuxedoMan,
} from '@tuxedoman'
import {
  DISPLAY_NAME,
  SETTING,
  SETTING_DESCRIPTION,
  SETTING_PARAMS,
  setValue,
} from '@voice-settings/threshold'

export default new SettingCommand({
  name: 'voiceThreshold',
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
    return `${dbGuild?.get(SETTING) as number ?? 1}`
  },
  run: async (bot, { msg, params }) => {
    const dbGuild = await bot.dbm.newQuery('guild').get(msg.channel.guild.id)
    return setValue(params, dbGuild!)
  },
})
