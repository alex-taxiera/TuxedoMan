import {
  CommandResults,
  GuildCommand,
} from 'eris-boiler'

export default new GuildCommand({
  name: 'inspect',
  description: 'Get details about a specific guild.',
  options: {
    parameters: [ '<guildId>' ],
  },
  run: async (bot, { msg, params }): Promise<CommandResults> => {
    const guildId = params[0]
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const guild = bot.guilds.get(guildId!)

    if (!guild) {
      return 'Guild not found.'
    }

    const invites = await guild.getInvites().catch(() => null)
    const owner = await bot.getRESTUser(guild.ownerID).catch(() => null)

    const fields = []
    if (owner) {
      fields.push({
        name: 'Owner',
        value: `${owner.username}#${owner.discriminator} (${owner.id})`,
      })
    }

    if ((invites?.length ?? 0) > 0) {
      fields.push({
        name: 'Invite',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        value: `https://discord.gg/${invites![0]!.code}`,
      })
    }

    return {
      embed: {
        title: `'${guild.name}' (${guild.id})`,
        fields,
      },
    }
  },
})
