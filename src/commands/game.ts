import {
  CommandResults
} from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'

export default new GuildCommand({
  name: 'setup',
  description: 'Setup default roles.',
  options: {
    parameters: [
      '<user> (mention or id)'
    ]
  },
  run: (bot, { channel, params }): CommandResults => {
    const target = channel.guild.members.get(params[0])

    if (!target) {
      return 'Member not found!'
    }

    if (!target.activities?.length) {
      return 'Member is not doing anything!'
    }

    return '```\n' + target.activities.map((act) => act.name) + '\n```'
  }
})
