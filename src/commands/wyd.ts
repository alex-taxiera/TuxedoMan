import {
  CommandResults
} from 'eris-boiler'
import * as logger from 'eris-boiler/util/logger'
import { GuildCommand } from '@tuxedoman'

export default new GuildCommand({
  name: 'wyd',
  description: 'Check what someone is doing.',
  options: {
    parameters: [
      '<user> (mention or id)'
    ]
  },
  run: (bot, { msg, params }): CommandResults => {
    const target = msg.channel.guild.members.get(params[0])

    if (!target) {
      return 'Member not found!'
    }

    if (!target.activities?.length) {
      return 'Member is not doing anything!'
    }

    logger.info(`ACTIVITIES FOR ${target.id}`)
    logger.info(JSON.stringify(target.activities, null, 2))

    return '```\nGame:\n' +
      target.game?.name +
      '\n\nActivities:\n' +
      target.activities.map((act) => act.name) +
      '\n```'
  }
})
