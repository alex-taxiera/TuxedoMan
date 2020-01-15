import {
  CommandResults
} from 'eris-boiler'
import { GuildCommand } from '@tuxedoman'

export default new GuildCommand({
  name: 'game',
  description: 'Check what game someone is playing.',
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

    return '```\nGame:\n' +
    target.game?.name +
    '\n\nActivities:\n' +
    target.activities.map((act) => act.name).join('\n') +
    '\n```'
  }
})
