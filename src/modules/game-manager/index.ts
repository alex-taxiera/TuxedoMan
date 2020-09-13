import {
  Member,
  Guild,
  Role,
  Activity,
  Overwrite,
} from 'eris'
import {
  DatabaseObject,
} from 'eris-boiler'
import * as logger from 'eris-boiler/util/logger'

import { TuxedoMan } from '@tuxedoman'
import { JobQueue } from '@util/job-queue'
import {
  editRoles,
  countMembersWithRole,
} from '@discord/roles'

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
  games: Array<string>
}

export type CommonRoleNames = {
  [key in CommonRoleType]: string;
}
export type CommonGameRoles = {
  [key in CommonRoleType]?: CommonRole;
}
export type GuildGameRoles = {
  commonRoles: CommonGameRoles
  trackedRoles: Array<GameRole>
}

export default class GameManager {

  private readonly multiQueue = new Map<string, JobQueue<void>>();

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
      guild.members.map((member) => this.checkMember(bot, member)),
    )

    await this.checkVoiceForGuild(bot, guild)
  }

  public async checkMember (
    bot: TuxedoMan,
    member: Member,
    runVoiceCheck: boolean = false,
  ): Promise<void> {
    if (member.bot) {
      return
    }

    const queueKey = `${member.guild.id}-${member.id}`
    let queue = this.multiQueue.get(queueKey)
    if (!queue) {
      const newQueue = new JobQueue<void>()
      this.multiQueue.set(queueKey, newQueue)
      queue = newQueue
    }

    await queue.push(async () => {
      const {
        commonRoles,
        trackedRoles,
      } = await this.getRolesForGuild(bot, member.guild)

      let activity: Activity | undefined
      let toAdd = ''

      for (const act of member.activities ?? []) {
        if (act.type < 4 && activity?.type !== 1 &&
          (
            !activity || act.type === 1 ||
            (!activity.assets && act.assets) ||
            (
              activity.created_at < act.created_at &&
              !(activity.assets && !act.assets)
            )
          )
        ) {
          activity = act
        }
      }

      if (activity) {
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
      ].filter((x) => x && x.role !== toAdd) as Array<GameRole | CommonRole>)
        .map((tracked) => tracked.role)

      await editRoles(member, roleIds.filter((id) => !trackedIds.includes(id)))

      if (runVoiceCheck) {
        await this.checkVoiceForGuild(bot, member.guild)
      }
    }).catch((res: { error: Error }) => {
      throw res.error
    })

    if (queue.length === 0) {
      this.multiQueue.delete(queueKey)
    }
  }

  private async fixVoiceRooms (
    bot: TuxedoMan,
    guild: Guild,
    dbos: Array<DatabaseObject>,
  ): Promise<Array<DatabaseObject>> {
    const res: Array<DatabaseObject> = []
    const promises: Array<Promise<unknown>> = []

    const settings = await bot.dbm.newQuery('guild').get(guild.id)

    for (const dbo of dbos) {
      const channel = guild.channels.get(dbo.get('channel'))
      if (!channel) {
        promises.push(dbo.delete())
      } else if (countMembersWithRole(guild.members, dbo.get('role')) === 0) {
        promises.push(dbo.delete(), channel.delete())
      } else {
        const gameRole = await this.getGameRoleByRoleId(
          bot, guild.id, dbo.get('role'),
        )
        const parentID = gameRole?.voiceChannelCategory ??
          settings?.get('voiceChannelCategory') as string
        if (channel?.parentID !== parentID) {
          promises.push(channel?.edit({
            parentID,
          }))
        }
        res.push(dbo)
      }
    }

    await Promise.all(promises)

    return res
  }

  public async checkVoiceForGuild (
    bot: TuxedoMan,
    guild: Guild,
  ): Promise<void> {
    logger.info(`CHECK VOICE FOR GUILD ${guild.id}`)
    const settings = await bot.dbm.newQuery('guild').get(guild.id)
    if (!settings?.get('manageVoice')) {
      return
    }
    const voiceRooms = await this.fixVoiceRooms(
      bot,
      guild,
      await bot.dbm.newQuery('room')
        .equalTo('guild', guild.id)
        .find(),
    )

    const guildVoiceThreshold = settings?.get('voiceChannelThreshold') as number
    const guildVoiceLimit = settings?.get('voiceChannelLimit') as number
    const { trackedRoles } = await this.getRolesForGuild(bot, guild)

    for (const tracked of trackedRoles) {
      if (tracked.manageVoice === false) {
        continue
      }
      const roleId = tracked.role
      const roleVoiceThreshold = tracked.voiceChannelThreshold
      const roleVoiceLimit = tracked.voiceChannelLimit
      const discordRole = guild.roles.get(roleId)

      const existingChannelDbos = voiceRooms
        .filter((roomDbo) => roomDbo.get('role') === roleId)

      const count = countMembersWithRole(guild.members, roleId)
      if (
        count >= (roleVoiceThreshold ?? guildVoiceThreshold ?? 1) &&
        existingChannelDbos.length === 0
      ) {
        const parent = guild.channels.get(
          tracked.voiceChannelCategory ??
            settings?.get('voiceChannelCategory'),
        )
        const parentPermissions = {
          everyone: {
            allow: parent?.permissionOverwrites.get(guild.id)?.allow ?? 0,
            deny: parent?.permissionOverwrites.get(guild.id)?.deny ?? 0,
          },
          role: {
            allow: parent?.permissionOverwrites.get(roleId)?.allow ?? 0,
            deny: parent?.permissionOverwrites.get(roleId)?.deny ?? 0,
          },
        }
        const permissionOverwrites: Array<Overwrite> = [
          ...parent?.permissionOverwrites.values() ?? [],
          {
            id: guild.id,
            type: 'role',
            allow: parentPermissions.everyone.allow,
            deny: parentPermissions.everyone.deny & 0x100000
              ? parentPermissions.everyone.deny
              : parentPermissions.everyone.deny | 0x100000,
          },
          {
            id: roleId,
            type: 'role',
            allow: parentPermissions.role.allow & 0x100000
              ? parentPermissions.role.allow
              : parentPermissions.role.allow | 0x100000,
            deny: parentPermissions.role.deny,
          },
        ]

        const newRoomDbo = await bot.dbm.newObject('room', {
          guild: guild.id,
          role: roleId,
        }).save()

        try {
          const vc = await guild.createChannel(
            discordRole?.name ?? tracked.id,
            2,
            {
              parentID: parent?.id,
              userLimit: roleVoiceLimit ?? guildVoiceLimit,
              permissionOverwrites,
            },
          )

          await newRoomDbo.save({
            channel: vc.id,
          }).catch((error) => {
            vc?.delete().catch(logger.error)
            throw error
          })
        } catch (error) {
          newRoomDbo.delete().catch(logger.error)
          throw error
        }
      }
    }
  }

  public async checkAllRoles (bot: TuxedoMan, guild: Guild): Promise<void> {
    logger.info('CHECK ALL ROLES')
    await Promise.all(
      guild.roles.map((role) => this.checkRole(bot, guild, role)),
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
    return this.getDbo(bot, 'role', guildId, roleId)
  }

  public async getGamesForGameRole (
    bot: TuxedoMan,
    gameRole: DatabaseObject,
  ): Promise<Array<string>> {
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

    return {
      ...gameRole.toJSON(),
      games: await this.getGamesForGameRole(bot, gameRole),
    } as GameRole
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

    if (!game) {
      return
    }

    return this.getGameRoleByRoleId(bot, guildId, game.get('role'))
  }

  public async getRolesForGuild (
    bot: TuxedoMan,
    guild: Guild,
  ): Promise<GuildGameRoles> {
    const gameRoles = await bot.dbm.newQuery('role')
      .equalTo('guild', guild.id)
      .find()

    const commonRoles: CommonGameRoles = this.getEmptyCommonRoles()
    const trackedRoles: Array<GameRole> = []

    for (const gameRole of gameRoles) {
      const role = this.getRoleFromRecord(bot, gameRole)
      if (!role) {
        continue
      }
      if (this.dbRoleIsCommon(gameRole)) {
        commonRoles[gameRole.get('type') as CommonRoleType] =
          gameRole.toJSON() as CommonRole
      } else {
        trackedRoles.push({
          ...gameRole.toJSON(),
          games: await this.getGamesForGameRole(bot, gameRole),
        } as GameRole)
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
  ): Role | void {
    const guild = bot.guilds.get(gameRole.get('guild'))
    if (guild?.roles.has(gameRole.get('role'))) {
      return (guild.roles.get(gameRole.get('role')) as Role)
    }

    gameRole.delete().catch(logger.error)
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
      (Object.keys(commonRoles) as Array<CommonRoleType>).map(async (key) => {
        if (!commonRoles[key]) {
          clone[key] = await this.addCommonRole(bot, guild, key)
        }
      }),
    )

    return clone
  }

  private getEmptyCommonRoles (): CommonGameRoles {
    return (Object.keys(this.roleNames) as Array<CommonRoleType>)
      .reduce((ax, dx) => {
        ax[dx] = undefined
        return ax
      }, {} as CommonGameRoles)
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
      }).save()).toJSON(),
      games: [],
    } as CommonRole

    return commonRole
  }

  public async addTrackedGame (
    bot: TuxedoMan,
    guild: Guild,
    gameName: string,
    roleName: string,
  ): Promise<void> {
    let role = guild.roles.find((role) => role.name === roleName)
    if (!role) {
      role = await this.createRole(bot, guild, roleName)
    }

    let gameRole = await this.getGameRoleByRoleId(bot, guild.id, role.id)
    if (!gameRole) {
      gameRole = {
        ...(await bot.dbm.newObject('role', {
          guild: guild.id,
          role: role.id,
          type: 'game',
        }).save()).toJSON(),
        games: [],
      } as GameRole
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

    let position = 0
    if (trackedRoles.length) {
      const [ lowestTrackedRole ] = trackedRoles
        .filter((tracked) => tracked.role !== role.id)
        .map((tracked) => guild.roles.get(tracked.role) as Role)
        .sort((a, b) => a.position - b.position)
      position = lowestTrackedRole.position - 1
    } else {
      const commonRolelist = Object.values(commonRoles).filter((r) => r)
      if (commonRolelist.length) {
        const [ highestMiscRole ] = commonRolelist
          .map((common) => guild.roles.get(common?.role ?? '') as Role)
          .sort((a, b) => b.position - a.position)
        position = highestMiscRole.position
      } else {
        const member = guild.members.get(bot.user.id)
        if (member) {
          const [ lowestControlRole ] = member.roles
            .map((id) => guild.roles.get(id) as Role)
            .sort((a, b) => a.position - b.position)
          position = lowestControlRole.position - 1
        }
      }
    }

    if (position) {
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
