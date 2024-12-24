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

    const onlineMembers = guild.members
      .filter((member) => member.status === 'online')
      .map((member) => member.username)

    // eslint-disable-next-line no-console
    console.log('onlineMembers :', onlineMembers)

    // const newInvite = await bot.createChannelInvite(
    //   guild.systemChannelID ??
    //   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion
    //   guild.channels.values().next().value!.id,
    // // eslint-disable-next-line no-console
    // ).catch(console.error)

    // if (newInvite) {
    //   // eslint-disable-next-line no-console
    //   console.log(`https://discord.gg/${newInvite.code}`)
    // }

    const fields = [ {
      name: 'Member Count',
      value: guild.memberCount.toString(),
    } ]

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
