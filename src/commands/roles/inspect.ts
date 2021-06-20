import {
  CommandResults,
} from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'
import { countMembersWithRole } from '@discord/roles'
import * as voiceCategory from '@voice-settings/category'
import * as voiceThreshold from '@voice-settings/threshold'
import * as voiceToggle from '@voice-settings/toggle'

export default new GuildCommand({
  name: 'inspect',
  description: 'Get details about a specific tracked role.',
  options: {
    parameters: [ '<roleId/roleName>' ],
  },
  run: async (bot, { msg, params }): Promise<CommandResults> => {
    const roleId = params[0]
    const role = msg.channel.guild.roles.get(roleId) ??
      msg.channel.guild.roles.find((role) => role.name === roleId)

    if (!role) {
      return 'Role not found.'
    }

    const gameRole = await bot.gm.getGameRoleByRoleId(
      bot,
      msg.channel.guild.id,
      role.id,
    )
    if (!gameRole) {
      return 'Role not being tracked.'
    }
    const inline = true

    return {
      embed: {
        title: `Role Info: '${role.name}' (${role.id})`,
        fields: [
          {
            name: 'Games',
            value: gameRole.games.join('\n'),
          },
          {
            name: 'Members with this Role',
            value: countMembersWithRole(
              msg.channel.guild.members,
              role.id,
            ).toString(),
          },
          {
            name: '\u200b',
            value: '**--Settings--**',
          },
          {
            name: voiceToggle.DISPLAY_NAME,
            value: await voiceToggle.getValue(gameRole),
            inline,
          },
          {
            name: voiceThreshold.DISPLAY_NAME,
            value: await voiceThreshold.getValue(gameRole),
            inline,
          },
          {
            name: voiceCategory.DISPLAY_NAME,
            value: await voiceCategory.getValue(msg.channel.guild, gameRole),
            inline,
          },
        ],
      },
    }
  },
})
