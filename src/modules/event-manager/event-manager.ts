import {
  DatabaseObject,
  DataClient,
} from 'eris-boiler'
import {
  GuildScheduledEvent,
  Guild,
  Role,
  DiscordRESTError,
} from 'eris'
import { PriorityJobQueue } from '@util/job-queue'
import { logger } from 'eris-boiler/util'
import {
  addRole,
  removeRole,
} from '@discord/roles'

export interface EventRole {
  id: string
  role: string
  guild: string
}

const multiQueue = new Map<string, PriorityJobQueue>()

function getQueue (eventId: string): PriorityJobQueue {
  if (!multiQueue.has(eventId)) {
    multiQueue.set(eventId, new PriorityJobQueue(3))
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return multiQueue.get(eventId)!
}

async function getAllEventRoleDboForGuild (
  bot: DataClient,
  guildId: string,
): Promise<DatabaseObject[]> {
  const dbos = await bot.dbm.newQuery('eventRole')
    .equalTo('guild', guildId)
    .find()

  return dbos
}

async function createRoleForEvent (
  bot: DataClient,
  event: GuildScheduledEvent,
): Promise<Role> {
  return await bot.createRole(event.guild.id, {
    name: event.name,
    permissions: 0,
    mentionable: true,
  })
}

async function deleteRoleAndIgnoreUnknown (
  bot: DataClient,
  guildId: string,
  roleId: string,
): Promise<void> {
  await bot.deleteRole(guildId, roleId).catch((error) => {
    if (!(error instanceof DiscordRESTError) || error.code !== 10011) {
      throw error
    }
  })
}

async function getEventRoleDbo (
  bot: DataClient,
  guildId: string,
  eventId: string,
): Promise<DatabaseObject | undefined> {
  const [ dbo ] = await bot.dbm.newQuery('eventRole')
    .equalTo('guild', guildId)
    .equalTo('event', eventId)
    .limit(1)
    .find()

  return dbo
}

async function getEventRole (
  bot: DataClient,
  guildId: string,
  roleId: string,
): Promise<EventRole | undefined> {
  const dbo = await getEventRoleDbo(bot, guildId, roleId)

  if (!dbo) {
    return undefined
  }

  return dbo.toJSON() as EventRole
}

export async function deleteAllEventRolesForGuild (
  bot: DataClient,
  guildId: string,
): Promise<void> {
  const dbos = await getAllEventRoleDboForGuild(bot, guildId)

  await Promise.all(
    dbos.map(async (dbo) => {
      await deleteRoleAndIgnoreUnknown(bot, guildId, dbo.get('role'))
      await dbo.delete()
    }),
  )
}

async function createEventRole (
  bot: DataClient,
  event: GuildScheduledEvent,
): Promise<DatabaseObject> {
  const role = await createRoleForEvent(bot, event)

  return await bot.dbm.newObject('eventRole', {
    guild: event.guild.id,
    role: role.id,
    event: event.id,
  }).save()
}

export async function queueCreateEventRole (
  bot: DataClient,
  event: GuildScheduledEvent,
): Promise<DatabaseObject> {
  const { data } = await getQueue(event.id).push(
    async () => await createEventRole(bot, event),
    3,
  )

  return data
}

export async function queueUpdateEventRole (
  bot: DataClient,
  event: GuildScheduledEvent,
): Promise<void> {
  await getQueue(event.id).push(async () => {
    let dbo = await getEventRoleDbo(bot, event.guild.id, event.id)

    if (!dbo) {
      dbo = await createEventRole(bot, event)
    }

    await bot.editRole(event.guild.id, dbo.get('role'), {
      name: event.name,
    })
  })
}

export async function queueDeleteEventRole (
  bot: DataClient,
  event: GuildScheduledEvent,
): Promise<void> {
  await getQueue(event.id).push(async () => {
    const dbo = await getEventRoleDbo(bot, event.guild.id, event.id)

    if (!dbo) {
      return
    }

    await dbo.delete()
    await deleteRoleAndIgnoreUnknown(bot, event.guild.id, dbo.get('role'))
  }, 3)
}

export async function handleGuildCreate (
  bot: DataClient,
  guildId: string,
): Promise<void> {
  const oldDbos = await getAllEventRoleDboForGuild(bot, guildId)
  await Promise.all(oldDbos.map(async (dbo) => await dbo.delete()))

  const currentEvents = await bot.getGuildScheduledEvents(guildId)
  await Promise.all(
    currentEvents.map(async (event) => {
      const dbo = await createEventRole(bot, event)

      const users = await event.getUsers()
      await Promise.all(
        users.map(
          async ({ user }) =>
            await addRole(bot, guildId, user.id, dbo.get('role')),
        ),
      )
    }),
  )
}

export async function handleStartup (
  bot: DataClient,
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
): Promise<void[]> {
  return await Promise.all(bot.guilds.map(async (guild) => {
    const [ existingDbos, currentEvents ] = await Promise.all([
      getAllEventRoleDboForGuild(bot, guild.id),
      bot.getGuildScheduledEvents(guild.id),
    ])

    await Promise.all([
      ...currentEvents.map(async (event) => {
        if (!existingDbos.some((dbo) => dbo.get('event') === event.id)) {
          const [ dbo, users ] = await Promise.all([
            createEventRole(bot, event),
            event.getUsers(),
          ])

          await Promise.all(users.map(async ({ user }) =>
            await addRole(bot, guild.id, user.id, dbo.get('role')),
          ))
        }
      }),
      ...existingDbos.map(async (dbo) => {
        const roleId = dbo.get('role') as string
        const eventId = dbo.get('event') as string

        const event = currentEvents.find((event) => event.id === eventId)

        if (event) {
          const membersWithRole = guild.members
            .filter((member) => member.roles.includes(roleId))
          const membersWhoNeedRole = await event.getUsers()

          await Promise.all([
            bot.editRole(guild.id, roleId, {
              name: event.name,
            }),
            ...membersWithRole.filter((member) =>
              !membersWhoNeedRole.some(({ user }) => user.id === member.id),
            ).map(async ({ id: memberId }) =>
              await bot.removeGuildMemberRole(guild.id, memberId, roleId),
            ),
            ...membersWhoNeedRole.filter(({ user }) =>
              !membersWithRole.some((member) => user.id === member.id),
            ).map(async ({ user }) =>
              await bot.addGuildMemberRole(guild.id, user.id, roleId),
            ),
          ])
        } else {
          await deleteRoleAndIgnoreUnknown(bot, guild.id, dbo.get('role'))
          await dbo.delete()
        }
      }),
    ])
  }),
  )
}

export async function handleEventRoleDeleted (
  bot: DataClient,
  guild: Guild,
  role: Role,
): Promise<void> {
  const dbo = await getEventRoleDbo(bot, guild.id, role.id)

  if (dbo) {
    const newRole = await createRoleForEvent(
      bot,
      await guild.getRESTScheduledEvent(dbo.get('event')),
    )

    await dbo.save({ role: newRole.id })
  }
}

export async function addUserToEventRole (
  bot: DataClient,
  guildId: string,
  memberId: string,
  eventId: string,
): Promise<void> {
  await getQueue(eventId).push(async () => {
    const eventRole = await getEventRole(bot, guildId, eventId)

    if (!eventRole) {
      return
    }

    await bot.addGuildMemberRole(guildId, memberId, eventRole.role)
  }, 2)
}

export async function removeUserFromEventRole (
  bot: DataClient,
  guildId: string,
  memberId: string,
  eventId: string,
): Promise<void> {
  await getQueue(eventId).push(async () => {
    const eventRole = await getEventRole(bot, guildId, eventId)

    if (!eventRole) {
      return
    }

    await removeRole(bot, guildId, memberId, eventRole.role)
  }, 2)
}
