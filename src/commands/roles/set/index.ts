import { vip as permission } from '@tuxedoman/permissions'
import { GuildCommand } from '@tuxedoman'

import voiceToggle from './voiceToggle'
import voiceCategory from './voiceCategory'
import voiceThreshold from './voiceThreshold'

export default new GuildCommand({
  name: 'set',
  description: 'Change settings for a role.',
  options: {
    permission,
    subCommands: [
      voiceThreshold,
      voiceToggle,
      voiceCategory,
    ],
  },
  run: () => 'Usage: "set <settingName> <roleId/roleName> <value>"',
})
