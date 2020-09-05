import {
  Member,
  Guild,
  Presence,
  Role,
  Activity,
} from 'eris'
import {
  DatabaseObject,
} from 'eris-boiler'
import {
  ExtendedMap,
} from 'eris-boiler/util'
import * as logger from 'eris-boiler/util/logger'

import { TuxedoMan } from '@tuxedoman'
import { activitiesAreEqual } from '@util/activity'

type CommonRoleType = 'playing' | 'streaming' | 'watching' | 'listening'
type CommonRoleNames = {
  [key in CommonRoleType]: string;
}
type CommonGameRoles = {
  [key in CommonRoleType]?: DatabaseObject;
}
type TrackedRoles = ExtendedMap<string, DatabaseObject>
type GuildGameRoles = {
  commonRoles: CommonGameRoles
  trackedRoles: TrackedRoles
}

export default class GameManager {

  public guildVoiceChannelsByRoleId:
    Partial<Record<string, Partial<Record<string, string>>>> = {}

  constructor (
    private readonly roleNames: CommonRoleNames = {
      playing: 'Other Games',
      listening: 'Listening',
      watching: 'Watching',
      streaming: 'Streaming',
    },
  ) { }

  public async checkAllMembers (bot: TuxedoMan, guild: Guild): Promise<void> {
    logger.info('CHECK ALL MEMBERS')
    await Promise.all(
      guild.members.map((member) => this.checkMember(bot, member)),
    )
  }

  public async checkMember (
    bot: TuxedoMan,
    member: Member,
    oldPresence?: Presence,
    runVoiceCheck: boolean = false,
  ): Promise<void> {
    if (member.bot) {
      return
    }

    if (activitiesAreEqual([
      member.activities ?? [],
      oldPresence?.activities ?? [],
    ])) {
      return
    }

    let activity: Activity | undefined

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

    const {
      commonRoles,
      trackedRoles,
    } = await this.getRolesForGuild(bot, member.guild)
    let toAdd = ''

    if (activity) {
      logger.info(`${member.id} HAS ACTIVITY '${activity.name}'`)
      const guildOptions = (
        await bot.dbm.newQuery('guild').get(member.guild.id)
      ) as DatabaseObject

      switch (activity.type) {
        case 0:
          toAdd = trackedRoles.get(activity.name)?.get('role') ?? ''

          if (!toAdd && guildOptions.get('game')) {
            toAdd = commonRoles.playing?.get('role') ?? ''
          }
          break
        case 1:
          if (guildOptions.get('stream')) {
            toAdd = commonRoles.streaming?.get('role') ?? ''
          }
          break
        case 2:
          if (guildOptions.get('listen')) {
            toAdd = commonRoles.listening?.get('role') ?? ''
          }
          break
        case 3:
          if (guildOptions.get('watch')) {
            toAdd = commonRoles.watching?.get('role') ?? ''
          }
          break
      }
    }

    if (toAdd && !member.roles.includes(toAdd)) {
      await this.addRole(member, toAdd)
    }

    await Promise.all(
      Object.values(commonRoles).concat(Array.from(trackedRoles.values()))
        .map(async (dbo) => {
          if ((dbo?.get('role') ?? '') !== toAdd) {
            return this.removeRole(member, dbo?.get('role'))
          }
        }),
    )

    if (runVoiceCheck) {
      await this.checkVoiceForGuild(bot, member.guild)
    }
  }

  public async checkVoiceForGuild (
    bot: TuxedoMan,
    guild: Guild,
  ): Promise<void> {
    const settings = await bot.dbm.newQuery('guild').get(guild.id)
    if (!settings?.get('manageVoice')) {
      return
    }
    let voiceChannelsByRoleId = this.guildVoiceChannelsByRoleId[guild.id]
    if (!voiceChannelsByRoleId) {
      voiceChannelsByRoleId = this.guildVoiceChannelsByRoleId[guild.id] = {}
    }

    const voiceThreshold = settings?.get('voiceChannelThreshold') as number
    const {
      trackedRoles,
    } = await this.getRolesForGuild(bot, guild)
    const trackedRoleIds: Array<string> = trackedRoles
      .map((dbo) => dbo.get('role') as string)

    const trackedRoleCounter = new ExtendedMap<string, number>()
    for (const member of guild.members.values()) {
      const tracked = trackedRoleIds
        .filter((roleId) => member.roles.includes(roleId))
      for (const roleId of tracked) {
        trackedRoleCounter.set(roleId, (
          trackedRoleCounter.get(roleId) ?? 0
        ) + 1)
      }
    }

    for (const [ roleId, count ] of trackedRoleCounter) {
      if (count >= voiceThreshold) {
        // there should be a voice channel, if not create it
        if (voiceChannelsByRoleId[roleId]) {
          
        }
      } else {
        // there should not be a voice channel, if there is one delete it
      }
    }
  }

  private async getRoleRecordForGame (
    bot: TuxedoMan,
    guild: Guild,
    game: string,
  ): Promise<DatabaseObject | void> {
    const [ gameRole ] = await bot.dbm.newQuery('role')
      .equalTo('guild', guild.id)
      .equalTo('game', game)
      .find()

    return gameRole
  }

  public async checkRole (
    bot: TuxedoMan,
    guild: Guild,
    role: Role,
  ): Promise<void> {
    if (!guild.roles.has(role.id)) {
      return bot.dbm.newQuery('role')
        .equalTo('guild', guild.id)
        .equalTo('role', role.id)
        .find()
        .then(([ gameRole ]) => gameRole ? gameRole.delete() : undefined)
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

  public async getGameRolesByRoleID (
    bot: TuxedoMan,
    roleId: string,
  ): Promise<Array<DatabaseObject>> {
    const gameRoles = await bot.dbm.newQuery('role')
      .equalTo('role', roleId)
      .find()

    return gameRoles
  }

  public async getGameRoleByGameName (
    bot: TuxedoMan,
    gameName: string,
  ): Promise<Array<DatabaseObject>> {
    const gameRoles = await bot.dbm.newQuery('role')
      .equalTo('game', gameName)
      .limit(1)
      .find()

    return gameRoles
  }

  public async getRolesForGuild (
    bot: TuxedoMan,
    guild: Guild,
  ): Promise<GuildGameRoles> {
    const gameRoles = await bot.dbm.newQuery('role')
      .equalTo('guild', guild.id)
      .find()

    const commonRoles: CommonGameRoles = this.getEmptyCommonRoles()
    const trackedRoles: TrackedRoles = new ExtendedMap<string, DatabaseObject>()

    for (const gameRole of gameRoles) {
      const role = this.getRoleFromRecord(bot, gameRole)
      if (!role) {
        continue
      }
      if (this.dbRoleIsCommon(gameRole)) {
        commonRoles[gameRole.get('type') as CommonRoleType] = gameRole
      } else {
        trackedRoles.set(gameRole.get('game'), gameRole)
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

  public async startup (bot: TuxedoMan): Promise<void> {
    await Promise.all(bot.guilds.map(async (guild) => {
      await Promise.all(
        guild.roles.map((role) => this.checkRole(bot, guild, role)),
      )
      return this.checkAllMembers(bot, guild)
    }))
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
          const name = this.roleNames[key]
          const existingRole = guild.roles
            .find((role) => role.name === name)

          const gameRole = await this.upsertTrackedRole(
            bot,
            guild,
            key,
            existingRole || await this.createRole(bot, guild, name),
            key,
          )

          clone[gameRole.get('type') as CommonRoleType] = gameRole
        }
      }),
    )

    return clone
  }

  public async trackGame (
    bot: TuxedoMan,
    guild: Guild,
    roleName: string,
    gameName: string,
  ): Promise<string> {
    const { trackedRoles } = await this.getRolesForGuild(bot, guild)

    if (trackedRoles.has(gameName)) {
      return 'Already exists tracking list!'
    }

    const role = guild.roles.find((r) => r.name === roleName)
    if (role) {
      await this.upsertTrackedRole(bot, guild, gameName, role)
      return 'Added to tracking list!'
    }
    const newRole = await this.createRole(bot, guild, roleName)
    if (!newRole) {
      return 'Could not create role.'
    }
    await this.upsertTrackedRole(bot, guild, gameName, newRole)
    return 'Created role and added to tracking list!'
  }

  public async untrackGame (
    bot: TuxedoMan,
    guild: Guild,
    gameName: string,
  ): Promise<string> {
    const { trackedRoles } = await this.getRolesForGuild(bot, guild)
    const role = trackedRoles.get(gameName)
    if (!role) {
      return 'Not found in tracking list!'
    }

    await this.removeTrackedRole(bot, guild, role)

    return 'Untracked!'
  }

  private getEmptyCommonRoles (): CommonGameRoles {
    return (Object.keys(this.roleNames) as Array<CommonRoleType>)
      .reduce((ax, dx) => {
        ax[dx] = undefined
        return ax
      }, {} as CommonGameRoles)
  }

  private async upsertTrackedRole (
    bot: TuxedoMan,
    guild: Guild,
    game: string,
    role: Role,
    type?: CommonRoleType,
  ): Promise<DatabaseObject> {
    const gameRole = await this.getRoleRecordForGame(bot, guild, game)
    if (gameRole) {
      return gameRole.save({
        role: role.id,
      })
    } else {
      const gameRole = await bot.dbm.newObject('role', {
        guild: guild.id,
        role: role.id,
        game,
        type,
      })
        .save()

      await this.checkAllMembers(bot, guild)
      return gameRole
    }
  }

  private clearRole (
    bot: TuxedoMan,
    guild: Guild,
    role: Role,
  ): Promise<void> | void {
    return Promise.all(guild.members.map(async (member) => {
      if (member.bot || !member.roles.includes(role.id)) {
        return
      }

      await this.removeRole(member, role.id)
    })).then(() => this.checkAllMembers(bot, guild))
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
    if (trackedRoles.size) {
      const [ lowestTrackedRole ] = [ ...trackedRoles.values() ]
        .filter((dbo) => dbo.get('role') !== role.id)
        .map((dbo) => guild.roles.get(dbo.get('role')) as Role)
        .sort((a, b) => a.position - b.position)
      position = lowestTrackedRole.position - 1
    } else {
      const commonRolelist = Object.values(commonRoles).filter((r) => r)
      if (commonRolelist.length) {
        const [ highestMiscRole ] = commonRolelist
          .map((dbo) => guild.roles.get(dbo?.get('role')) as Role)
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

  private removeTrackedRole (
    bot: TuxedoMan,
    guild: Guild,
    gameRole: DatabaseObject,
  ): Promise<void> {
    const role = guild.roles.get(gameRole.get('role'))
    return Promise.all([
      gameRole.delete(),
      role ? this.clearRole(bot, guild, role) : Promise.resolve(),
    ]).then(() => Promise.resolve())
  }

  private removeRole (member: Member, id: string): Promise<void> | void {
    if (member.roles.includes(id)) {
      logger.info(`REMOVE ROLE ${id} FROM ${member.id}`)
      return member.removeRole(id)
    }
  }

  private addRole (member: Member, id: string): Promise<void> {
    logger.info(`ADD ROLE ${id} TO ${member.id}`)
    return member.addRole(id)
  }

}
