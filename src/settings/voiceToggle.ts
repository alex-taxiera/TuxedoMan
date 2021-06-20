import {
  SettingCommand,
  TuxedoMan,
} from '@tuxedoman'
import {
  DISPLAY_NAME,
  getValue,
  SETTING,
  SETTING_DESCRIPTION,
  setValue,
} from '@voice-settings/toggle'

export default new SettingCommand({
  name: 'voice',
  description: SETTING_DESCRIPTION,
  displayName: DISPLAY_NAME,
  setting: SETTING,
  options: {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    postHook: TuxedoMan.checkVoicePostHook,
  },
  getValue: async function (bot, { msg: { channel } }) {
    const dbGuild = await bot.dbm.newQuery('guild').get(channel.guild.id)

    return getValue(dbGuild?.toJSON())
  },
  run: async function (bot, { msg: { channel } }) {
    const dbGuild = await bot.dbm.newQuery('guild').get(channel.guild.id)
    return setValue(dbGuild!)
  },
})
