import {
  Member,
  Guild,
  Role,
  Activity
} from 'eris'
import { DatabaseObject } from 'eris-boiler'
import * as logger from 'eris-boiler/util/logger'

import { TuxedoMan } from '@tuxedoman'
import { JobQueue } from '@util/job-queue'
import { editRoles } from '@discord/roles'
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

export default class GameManager {

  private readonly multiQueue = new Map<string, JobQueue<void>>()

  constructor (
    private readonly roleNames: CommonRoleNames = {
      playing: 'Other Games',
      listening: 'Listening',
      watching: 'Watching',
      streaming: 'Streaming',
    },
  ) {}

  public async checkAllMembers (bot: TuxedoMan, guild: Guild): Promise<void> {
    logger.info('CHECK ALL MEMBERS')
    await Promise.all(
      guild.members.map(
        async (member) => await this.checkMember(bot, member, computeActivity(member)),
      ),
    )
  }

  public async checkMember (
    bot: TuxedoMan,
    member: Member,
    activity: Pick<Activity, 'name' | 'type'> | undefined,
  ): Promise<void> {
    if (member.bot) {
      return
    }

    const queueKey = `${member.guild.id}-${member.id}`
    let queue = this.multiQueue.get(queueKey)
    if (queue == null) {
      const newQueue = new JobQueue<void>()
      this.multiQueue.set(queueKey, newQueue)
      queue = newQueue
    }

    await queue.push(async () => {
      const {
        commonRoles,
        trackedRoles,
      } = await this.getRolesForGuild(bot, member.guild)

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

      const roleIds = [ ...member.roles ]
      if (toAdd && !roleIds.includes(toAdd)) {
        roleIds.push(toAdd)
      }

      const trackedIds = ([
        ...Object.values(commonRoles),
        ...trackedRoles,
      ].filter((x) => x && x.role !== toAdd))
        .map((tracked) => tracked.role)

      await editRoles(member, roleIds.filter((id) => !trackedIds.includes(id)))
    }).catch((res: { error: Error }) => {
      throw res.error
    })

    if (queue.length === 0) {
      this.multiQueue.delete(queueKey)
    }
  }

  // TODO: use this on startup
  public async checkAllRoles (bot: TuxedoMan, guild: Guild): Promise<void> {
    logger.info('CHECK ALL ROLES')
    await Promise.all(
      guild.roles.map(async (role) => await this.checkRole(bot, guild, role)),
    )
  }

  public async checkRole (
    bot: TuxedoMan,
    guild: Guild,
    role: Role,
  ): Promise<void> {
    if (!guild.roles.has(role.id)) {
      const gameRole = await this.getRoleDbo(bot, guild.id, role.id)

      await gameRole?.delete()
    }
  }

  private dbRoleIsCommon (dbRole: DatabaseObject): boolean {
    switch (dbRole.get('type')) {
      case 'playing':
      case 'streaming':
      case 'watching':
      case 'listening':
        return true
      default: return false
    }
  }

  private async getDbo (
    bot: TuxedoMan,
    type: 'game' | 'role',
    guildId: string,
    roleId: string,
  ): Promise<DatabaseObject | undefined> {
    const [ dbo ] = await bot.dbm.newQuery(type)
      .equalTo('guild', guildId)
      .equalTo('role', roleId)
      .limit(1)
      .find()

    return dbo
  }

  public async getRoleDbo (
    bot: TuxedoMan,
    guildId: string,
    roleId: string,
  ): Promise<DatabaseObject | undefined> {
    return await this.getDbo(bot, 'role', guildId, roleId)
  }

  public async getGamesForGameRole (
    bot: TuxedoMan,
    gameRole: DatabaseObject,
  ): Promise<string[]> {
    const games = await bot.dbm.newQuery('game')
      .equalTo('guild', gameRole.get('guild'))
      .equalTo('role', gameRole.get('role'))
      .find()

    return games.map((game) => game.get('name') as string)
  }

  public async getGameRoleByRoleId (
    bot: TuxedoMan,
    guildId: string,
    roleId: string,
  ): Promise<GameRole | undefined> {
    const [ gameRole ] = await bot.dbm.newQuery('role')
      .equalTo('guild', guildId)
      .equalTo('role', roleId)
      .limit(1)
      .find()

    if (!gameRole) {
      return
    }

    const x = {
      ...gameRole.toJSON() as GameRole,
      games: await this.getGamesForGameRole(bot, gameRole),
    }

    return x
  }

  public async getGameByName (
    bot: TuxedoMan,
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

  public async getGameRoleByGameName (
    bot: TuxedoMan,
    guildId: string,
    gameName: string,
  ): Promise<GameRole | undefined> {
    const game = await this.getGameByName(bot, guildId, gameName)

    if (game == null) {
      return
    }

    return await this.getGameRoleByRoleId(bot, guildId, game.get('role'))
  }

  public async getRolesForGuild (
    bot: TuxedoMan,
    guild: Guild,
  ): Promise<GuildGameRoles> {
    const gameRoles = await bot.dbm.newQuery('role')
      .equalTo('guild', guild.id)
      .find()

    const commonRoles: CommonGameRoles = this.getEmptyCommonRoles()
    const trackedRoles: GameRole[] = []

    for (const gameRole of gameRoles) {
      const role = this.getRoleFromRecord(bot, gameRole)
      if (role == null) {
        continue
      }
      if (this.dbRoleIsCommon(gameRole)) {
        commonRoles[gameRole.get('type') as CommonRoleType] =
          gameRole.toJSON() as CommonRole
      } else {
        trackedRoles.push({
          ...gameRole.toJSON() as GameRole,
          games: await this.getGamesForGameRole(bot, gameRole),
        })
      }
    }

    return {
      commonRoles,
      trackedRoles,
    }
  }

  public getRoleFromRecord (
    bot: TuxedoMan,
    gameRole: DatabaseObject,
  ): Role | undefined {
    const guild = bot.guilds.get(gameRole.get('guild'))
    if (guild?.roles.has(gameRole.get('role'))) {
      return (guild.roles.get(gameRole.get('role')) as Role)
    }

    gameRole.delete().catch((error: Error) => logger.error(error, error.stack))
  }

  public async setupMiscRoles (bot: TuxedoMan, guild: Guild): Promise<void> {
    const { commonRoles } = await this.getRolesForGuild(bot, guild)
    await this.fillDefaultRoles(bot, guild, commonRoles)
  }

  private async fillDefaultRoles (
    bot: TuxedoMan,
    guild: Guild,
    commonRoles: CommonGameRoles,
  ): Promise<CommonGameRoles> {
    const clone: CommonGameRoles = JSON.parse(
      JSON.stringify(commonRoles),
    ) as CommonGameRoles

    await Promise.all(
      (Object.keys(commonRoles) as CommonRoleType[]).map(async (key) => {
        if (commonRoles[key] == null) {
          clone[key] = await this.addCommonRole(bot, guild, key)
        }
      }),
    )

    return clone
  }

  private getEmptyCommonRoles (): CommonGameRoles {
    return (Object.keys(this.roleNames) as CommonRoleType[])
      .reduce<CommonGameRoles>((ax, dx) => {
      ax[dx] = undefined
      return ax
    }, {})
  }

  private async addCommonRole (
    bot: TuxedoMan,
    guild: Guild,
    type: CommonRoleType,
  ): Promise<CommonRole> {
    const name = this.roleNames[type]
    const existingRole = guild.roles
      .find((role) => role.name === name)

    const commonRole = {
      ...(await bot.dbm.newObject('role', {
        guild: guild.id,
        role: existingRole?.id ?? this.createRole(bot, guild, name),
        type,
      }).save()).toJSON() as CommonRole,
      games: [],
    }

    return commonRole
  }

  public async addTrackedGame (
    bot: TuxedoMan,
    guild: Guild,
    gameName: string,
    roleName: string,
  ): Promise<void> {
    let role = guild.roles.find((role) => role.name === roleName)
    if (role == null) {
      role = await this.createRole(bot, guild, roleName)
    }

    let gameRole = await this.getGameRoleByRoleId(bot, guild.id, role.id)
    if (gameRole == null) {
      gameRole = {
        ...(await bot.dbm.newObject('role', {
          guild: guild.id,
          role: role.id,
          type: 'game',
        }).save()).toJSON() as GameRole,
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

    await this.checkAllMembers(bot, guild)
  }

  private async createRole (
    bot: TuxedoMan,
    guild: Guild,
    name: string,
  ): Promise<Role> {
    const role = await guild.createRole({
      name, hoist: true, permissions: 0,
    })

    const {
      trackedRoles,
      commonRoles,
    } = await this.getRolesForGuild(bot, guild)

    let position
    if (trackedRoles.length > 0) {
      const [ lowestTrackedRole ] = trackedRoles
        .filter((tracked) => tracked.role !== role.id)
        .map((tracked) => guild.roles.get(tracked.role) as Role)
        .sort((a, b) => a.position - b.position)
      position = lowestTrackedRole.position - 1
    } else {
      const commonRolelist = Object.values(commonRoles).filter((r) => r)
      if (commonRolelist.length > 0) {
        const [ highestMiscRole ] = commonRolelist
          .map((common) => guild.roles.get(common?.role ?? '') as Role)
          .sort((a, b) => b.position - a.position)
        position = highestMiscRole.position
      } else {
        const member = guild.members.get(bot.user.id)
        if (member != null) {
          const [ lowestControlRole ] = member.roles
            .map((id) => guild.roles.get(id) as Role)
            .sort((a, b) => a.position - b.position)
          position = lowestControlRole.position - 1
        }
      }
    }

    if (position != null) {
      try {
        await role.editPosition(position)
      } catch (error) {
        logger.warn(`Problem setting role position to ${position}:`, error)
      }
    }

    return role
  }

  public async removeTrackedGame (
    bot: TuxedoMan,
    guild: Guild,
    gameName: string,
  ): Promise<void> {
    const game = await this.getGameByName(bot, guild.id, gameName)
    const roleId = game?.get('role') as string
    await game?.delete()
    const gameRole = await this.getGameRoleByRoleId(bot, guild.id, roleId)
    if (gameRole?.games.length === 0) {
      await this.deleteGameRole(bot, gameRole)
    }

    await this.checkAllMembers(bot, guild)
  }

  private async deleteGameRole (
    bot: TuxedoMan,
    gameRole: GameRole,
  ): Promise<void> {
    const dbo = await this.getRoleDbo(bot, gameRole.guild, gameRole.role)

    await dbo?.delete()
  }

}
