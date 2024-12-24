import {
  type CommandResults,
  GuildCommand,
} from 'eris-boiler'

import inspect from './inspect'

export default new GuildCommand({
  name: 'guilds',
  description: 'List active guilds.',
  options: {
    subCommands: [ inspect ],
  },
  run: (bot): CommandResults => {
    const list = bot.guilds.map(({ name, id }) => `${name} (${id})`).join('\n')

    return list
  },
})
