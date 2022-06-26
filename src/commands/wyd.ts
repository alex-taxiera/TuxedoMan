import {
  CommandResults,
  GuildCommand,
} from 'eris-boiler'
import * as logger from 'eris-boiler/util/logger'

export default new GuildCommand({
  name: 'wyd',
  description: 'Check what someone is doing.',
  options: {
    parameters: [
      '<user> (mention or id)',
    ],
  },
  run: (_, { msg, params }): CommandResults => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const target = msg.channel.guild.members.get(params[0]!)

    if (!target) {
      return 'Member not found!'
    }

    if (target.activities?.length === 0) {
      return 'Member is not doing anything!'
    }

    logger.info(`ACTIVITIES FOR ${target.id}\n${
      JSON.stringify(target.activities, null, 2)
    }`)

    return '```\nGame:\n' +
      (target.game?.name ?? 'N/A') +
      '\n\nActivities:\n' +
      (target.activities?.map((act) => act.name).join(', ') ?? '') +
      '\n```'
  },
})
