import {
  TuxedoMan,
  GuildCommand,
} from '@tuxedoman'
import {
  SETTING_DESCRIPTION,
  setValue,
} from '@voice-settings/toggle'

export default new GuildCommand({
  name: 'voice',
  description: SETTING_DESCRIPTION,
  options: {
    parameters: [
      'roleId/roleName',
    ],
    // eslint-disable-next-line @typescript-eslint/unbound-method
    postHook: TuxedoMan.checkVoicePostHook,
  },
  run: async function (bot, { msg, params }) {
    const roleId = params[0]
    const role = msg.channel.guild.roles.get(roleId) ??
      msg.channel.guild.roles.find((role) => role.name === roleId)

    if (!role) {
      return 'Role not found.'
    }

    const dbo = await bot.gm.getRoleDbo(bot, msg.channel.guild.id, role.id)
    if (!dbo) {
      return 'Role not being tracked.'
    }
    return setValue(dbo)
  },
})
