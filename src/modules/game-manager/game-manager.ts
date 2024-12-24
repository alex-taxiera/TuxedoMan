import {
  Member,
  Guild,
  Role,
  Activity,
  DiscordRESTError,
} from '@alex-taxiera/eris'
import {
  DatabaseObject,
  DataClient,
} from 'eris-boiler'
import * as logger from '@util/logger'

import { JobQueue } from '@util/job-queue'
import {
  addRole,
  editRoles,
} from '@discord/roles'
import { computeActivity } from '@util/activity'

export type CommonRoleType = 'playing' | 'streaming' | 'watching' | 'listening'
export type TrackedRoleType = 'game' | CommonRoleType
export interface TrackedRole {
  id: string
  role: string
  guild: string
  type: TrackedRoleType
  manageVoice?: boolean
  voiceChannelCategory?: string
  voiceChannelThreshold?: number
  voiceChannelLimit?: number
}

export interface CommonRole extends TrackedRole {
  type: CommonRoleType
}

export interface GameRole extends TrackedRole {
  type: 'game'
  games: string[]
}

export type CommonRoleNames = {
  [key in CommonRoleType]: string;
}
export type CommonGameRoles = {
  [key in CommonRoleType]?: CommonRole;
}
export interface GuildGameRoles {
  commonRoles: CommonGameRoles
  trackedRoles: GameRole[]
}

const multiQueue = new Map<string, JobQueue>()

const roleNames: CommonRoleNames = {
  playing: 'Other Games',
  listening: 'Listening',
  watching: 'Watching',
  streaming: 'Streaming',
}

async function createRole (
  bot: DataClient,
  guild: Guild,
  name: string,
): Promise<Role> {
  const role = await guild.createRole({
    name, hoist: true, permissions: 0,
  })

  const {
    trackedRoles,
    commonRoles,
  } = await getRolesForGuild(bot, guild)

  let position
  if (trackedRoles.length > 0) {
    const [ lowestTrackedRole ] = trackedRoles
      .filter((tracked) => tracked.role !== role.id)
      .map((tracked) => guild.roles.get(tracked.role) as Role)
      .sort((a, b) => a.position - b.position)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    position = lowestTrackedRole!.position - 1
  } else {
    const commonRolelist = Object.values(commonRoles).filter((r) => r)
    if (commonRolelist.length > 0) {
      const [ highestMiscRole ] = commonRolelist
        .map((common) => guild.roles.get(common?.role ?? '') as Role)
        .sort((a, b) => b.position - a.position)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      position = highestMiscRole!.position
    } else {
      const member = guild.members.get(bot.user.id)
      if (member != null) {
        const [ lowestControlRole ] = member.roles
          .map((id) => guild.roles.get(id) as Role)
          .sort((a, b) => a.position - b.position)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        position = lowestControlRole!.position - 1
      }
    }
  }

  if (position != null) {
    role.editPosition(position).catch(logger.error)
  }

  return role
}

function dbRoleIsCommon (dbRole: DatabaseObject): boolean {
  switch (dbRole.get('type')) {
    case 'playing':
    case 'streaming':
    case 'watching':
    case 'listening':
      return true
    default: return false
  }
}

async function getRoleDbo (
  bot: DataClient,
  guildId: string,
  roleId: string,
): Promise<DatabaseObject | undefined> {
  const [ dbo ] = await bot.dbm.newQuery('role')
    .equalTo('guild', guildId)
    .equalTo('role', roleId)
    .limit(1)
    .find()

  return dbo
}

function getRoleFromRecord (
  bot: DataClient,
  gameRole: DatabaseObject,
): Role | undefined {
  const guild = bot.guilds.get(gameRole.get('guild'))
  if (guild?.roles.has(gameRole.get('role'))) {
    return (guild.roles.get(gameRole.get('role')) as Role)
  }

  gameRole.delete().catch(logger.error)
}

async function getGamesForGameRole (
  bot: DataClient,
  gameRole: DatabaseObject,
): Promise<string[]> {
  const games = await bot.dbm.newQuery('game')
    .equalTo('guild', gameRole.get('guild'))
    .equalTo('role', gameRole.get('role'))
    .find()

  return games.map((game) => game.get('name') as string)
}

export async function checkAllMembers (
  bot: DataClient,
  guild: Guild,
): Promise<void> {
  await Promise.all(
    guild.members.map(async (member) =>
      await checkMember(bot, member, computeActivity(member)),
    ),
  )
}

export async function checkMember (
  bot: DataClient,
  member: Member,
  activity: Pick<Activity, 'name' | 'type'> | undefined,
): Promise<void> {
  const queueKey = `${member.guild.id}-${member.id}`
  let queue = multiQueue.get(queueKey)
  if (queue == null) {
    const newQueue = new JobQueue()
    multiQueue.set(queueKey, newQueue)
    queue = newQueue
  }

  await queue.push(async () => {
    const {
      commonRoles,
      trackedRoles,
    } = await getRolesForGuild(bot, member.guild)

    let toAdd = ''

    if (activity != null) {
      logger.info(`${member.id} HAS ACTIVITY '${activity.name}'`)
      const guildOptions = (
        await bot.dbm.newQuery('guild').get(member.guild.id)
      ) as DatabaseObject

      switch (activity.type) {
        case 0:
          toAdd = trackedRoles
            .find((gameRole) =>
              gameRole.games.includes(activity?.name ?? ''),
            )?.role ?? ''

          if (!toAdd && guildOptions.get('game')) {
            toAdd = commonRoles.playing?.role ?? ''
          }
          break
        case 1:
          if (guildOptions.get('stream')) {
            toAdd = commonRoles.streaming?.role ?? ''
          }
          break
        case 2:
          if (guildOptions.get('listen')) {
            toAdd = commonRoles.listening?.role ?? ''
          }
          break
        case 3:
          if (guildOptions.get('watch')) {
            toAdd = commonRoles.watching?.role ?? ''
          }
          break
      }
    }

    if (member.roles.length === 0 && toAdd) {
      await addRole(bot, member.guild.id, member.id, toAdd)
      return
    }

    const roleIds = [ ...member.roles ]
    if (toAdd && !roleIds.includes(toAdd)) {
      roleIds.push(toAdd)
    }

    const trackedIds = ([
      ...Object.values(commonRoles),
      ...trackedRoles,
    ].filter((x) => x != null && x.role !== toAdd))
      .map((tracked) => tracked.role)

    try {
      await editRoles(member, roleIds.filter((id) => !trackedIds.includes(id)))
    } catch (error) {
      if (error instanceof DiscordRESTError) {
        if (error.code === 50013) {
          logger.warn(
            `Missing permissions to edit roles for ${
              member.id
            } in ${
              member.guild.id
            }`,
          )
          const permissions = member.guild.permissionsOf(bot.user.id)
          logger.info(`Bot permissions: ${JSON.stringify(permissions.json)}`)
        }
      }
    }
  }).catch((res: { error: Error }) => {
    throw res.error
  })

  if (queue.length === 0) {
    multiQueue.delete(queueKey)
  }
}

export async function checkAllRoles (
  bot: DataClient,
  guild: Guild,
): Promise<void> {
  await Promise.all(
    guild.roles.map(async (role) => await checkRole(bot, guild, role)),
  )
}

export async function checkRole (
  bot: DataClient,
  guild: Guild,
  role: Role,
): Promise<void> {
  if (!guild.roles.has(role.id)) {
    const gameRole = await getRoleDbo(bot, guild.id, role.id)

    await gameRole?.delete()
  }
}

export async function getGameRoleByRoleId (
  bot: DataClient,
  guildId: string,
  roleId: string,
): Promise<{ dbo: DatabaseObject, games: string[] } | undefined> {
  const gameRole = await getRoleDbo(bot, guildId, roleId)

  if (!gameRole) {
    return
  }

  return {
    dbo: gameRole,
    games: await getGamesForGameRole(bot, gameRole),
  }
}

export async function getGameByName (
  bot: DataClient,
  guildId: string,
  gameName: string,
): Promise<DatabaseObject| undefined> {
  const [ game ] = await bot.dbm.newQuery('game')
    .equalTo('name', gameName)
    .equalTo('guild', guildId)
    .limit(1)
    .find()

  return game
}

export async function getRolesForGuild (
  bot: DataClient,
  guild: Guild,
): Promise<GuildGameRoles> {
  const gameRoles = await bot.dbm.newQuery('role')
    .equalTo('guild', guild.id)
    .find()

  const commonRoles: CommonGameRoles = (
    Object.keys(roleNames) as CommonRoleType[]
  ).reduce<CommonGameRoles>((ax, dx) => {
    ax[dx] = undefined
    return ax
  }, {})
  const trackedRoles: GameRole[] = []

  for (const gameRole of gameRoles) {
    const role = getRoleFromRecord(bot, gameRole)
    if (role == null) {
      continue
    }
    if (dbRoleIsCommon(gameRole)) {
      commonRoles[gameRole.get('type') as CommonRoleType] =
        gameRole.toJSON() as CommonRole
    } else {
      trackedRoles.push({
        ...gameRole.toJSON() as GameRole,
        games: await getGamesForGameRole(bot, gameRole),
      })
    }
  }

  return {
    commonRoles,
    trackedRoles,
  }
}

export async function setupMiscRoles (
  bot: DataClient,
  guild: Guild,
): Promise<void> {
  const { commonRoles } = await getRolesForGuild(bot, guild)

  await Promise.all(
    (Object.keys(commonRoles) as CommonRoleType[]).map(async (key) => {
      if (commonRoles[key] == null) {
        const name = roleNames[key]
        const existingRole = guild.roles
          .find((role) => role.name === name)

        await bot.dbm.newObject('role', {
          guild: guild.id,
          role: existingRole?.id ?? createRole(bot, guild, name),
          type: key,
        }).save()
      }
    }),
  )
}

export async function addTrackedGame (
  bot: DataClient,
  guild: Guild,
  gameName: string,
  roleName: string,
): Promise<void> {
  let role = guild.roles.find((role) => role.name === roleName)
  if (role == null) {
    role = await createRole(bot, guild, roleName)
  }

  let gameRole = await getGameRoleByRoleId(bot, guild.id, role.id)
  if (gameRole == null) {
    gameRole = {
      dbo: await bot.dbm.newObject('role', {
        guild: guild.id,
        role: role.id,
        type: 'game',
      }).save(),
      games: [],
    }
  }

  if (!gameRole.games.includes(gameName)) {
    await bot.dbm.newObject('game', {
      name: gameName,
      role: role.id,
      guild: guild.id,
    }).save()
  }

  await checkAllMembers(bot, guild)
}

export async function removeTrackedGame (
  bot: DataClient,
  guild: Guild,
  gameName: string,
): Promise<void> {
  const game = await getGameByName(bot, guild.id, gameName)
  const roleId = game?.get('role') as string
  await game?.delete()
  const gameRole = await getGameRoleByRoleId(bot, guild.id, roleId)
  if (gameRole?.games.length === 0) {
    await bot.deleteRole(guild.id, roleId)
    await gameRole.dbo.delete()
  } else {
    await checkAllMembers(bot, guild)
  }
}
