import {
  GuildCommand,
  TuxedoMan,
} from '@tuxedoman'
import {
  setValue,
  SETTING_DESCRIPTION,
  SETTING_PARAMS,
} from '@voice-settings/category'

export default new GuildCommand({
  name: 'voiceCategory',
  description: SETTING_DESCRIPTION,
  options: {
    parameters: [
      'roleId/roleName',
      ...SETTING_PARAMS,
    ],
    // eslint-disable-next-line @typescript-eslint/unbound-method
    postHook: TuxedoMan.checkVoicePostHook,
  },
  run: async (bot, { msg, params }) => {
    const roleId = params.shift() as string
    const role = msg.channel.guild.roles.get(roleId) ??
      msg.channel.guild.roles.find((role) => role.name === roleId)

    if (!role) {
      return 'Role not found.'
    }

    const dbo = await bot.gm.getRoleDbo(bot, msg.channel.guild.id, role.id)
    if (!dbo) {
      return 'Role not being tracked.'
    }
    return setValue(msg.channel.guild, params, dbo)
  },
})
