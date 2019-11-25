import {
  Member,
  Guild,
  GamePresence,
  Role
} from 'eris'
import {
  DatabaseObject,
  ExtendedMap
} from 'eris-boiler'

import TuxedoMan from '../tuxedoman'

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
  constructor (private roleNames: CommonRoleNames = {
    playing: 'Other Games',
    listening: 'Listening',
    watching: 'Watching',
    streaming: 'Streaming'
  }) {}

  async checkAllMembers (bot: TuxedoMan, guild: Guild): Promise<void> {
    await Promise.all(
      guild.members.map((member) => this.checkMember(bot, member))
    )
  }

  async checkMember (
    bot: TuxedoMan,
    member: Member,
    oldGame?: GamePresence
  ): Promise<void> {
    if (member.bot || member.game?.name === oldGame?.name) {
      return
    }

    const {
      commonRoles,
      trackedRoles
    } = await this.getRolesForGuild(bot, member.guild)

    await Promise.all([
      trackedRoles.map((role) => this.removeRole(member, role.get('role'))),
      Object.values(commonRoles)
        .map((role) => this.removeRole(member, role?.get('role')))
    ])

    if (member.game === undefined) {
      return
    }
    const role = member.guild.roles
      .find((role) => role.name === member.game?.name) // FIXME: use saved ID instead of name
    const [ guildOptions ] = await bot.dbm.newQuery('guild')
      .equalTo('id', member.guild.id)
      .find()

    switch (member.game.type) {
      case 0:
        if (trackedRoles.has(role?.id)) {
          this.addRole(member, role.id)
        } else if (guildOptions.get('game')) {
          this.addRole(member, commonRoles.playing?.id)
        }
        break
      case 1:
        if (guildOptions.get('stream')) {
          this.addRole(member, commonRoles.streaming?.id)
        }
        break
      case 2:
        if (guildOptions.get('listen')) {
          this.addRole(member, commonRoles.listening?.id)
        }
        break
      case 3:
        if (guildOptions.get('watch')) {
          this.addRole(member, commonRoles.watching?.id)
        }
        break
    }
  }

  private async getRoleRecordForGame (
    bot: TuxedoMan,
    guild: Guild,
    game: string
  ): Promise<DatabaseObject | void> {
    const [ gameRole ] = await bot.dbm.newQuery('role')
      .equalTo('guild', guild.id)
      .equalTo('game', game)
      .find()

    return gameRole
  }

  async checkRole (bot: TuxedoMan, guild: Guild, role: Role): Promise<void> {
    if (!guild.roles.has(role.id)) {
      const [ gameRole ] = await bot.dbm.newQuery('role')
        .equalTo('guild', guild.id)
        .equalTo('role', role.id)
        .find()

      if (gameRole) {
        await gameRole.delete()
      }
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

  async getRolesForGuild (
    bot: TuxedoMan,
    guild: Guild
  ): Promise<GuildGameRoles> {
    const gameRoles = await bot.dbm.newQuery('roles')
      .equalTo('guild', guild.id)
      .find()

    const commonRoles: CommonGameRoles = {}
    const trackedRoles: TrackedRoles = new ExtendedMap<string, DatabaseObject>()

    for (const gameRole of gameRoles) {
      const role = await this.getRoleFromRecord(bot, gameRole)
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
      trackedRoles
    }
  }

  getRoleFromRecord (
    bot: TuxedoMan,
    gameRole: DatabaseObject
  ): Role | Promise<void> {
    const guild = bot.guilds.get(gameRole.get('guild'))
    if (guild?.roles.has(gameRole.get('role'))) {
      return (guild.roles.get(gameRole.get('role')) as Role)
    }

    return gameRole.delete()
  }

  async startup (bot: TuxedoMan): Promise<void> {
    await Promise.all(bot.guilds.map(async (guild) => {
      await Promise.all(
        guild.roles.map((role) => this.checkRole(bot, guild, role))
      )
      return Promise.all(
        guild.members.map((member) => this.checkMember(bot, member))
      )
    }))
  }

  async setupMiscRoles (bot: TuxedoMan, guild: Guild): Promise<void> {
    const { commonRoles } = await this.getRolesForGuild(bot, guild)
    await Promise.all(
      (Object.keys(commonRoles) as Array<CommonRoleType>).map(async (key) => {
        if (!commonRoles[key]) {
          const newRole = await this.createRole(guild, this.roleNames[key])
          await this.upsertTrackedRole(bot, guild, key, newRole, key)
        }
      })
    )
    await this.checkAllMembers(bot, guild)
  }

  async trackGame (
    bot: TuxedoMan,
    guild: Guild,
    roleName: string,
    gameName: string
  ): Promise<string> {
    const { trackedRoles } = await this.getRolesForGuild(bot, guild)

    if (trackedRoles.has(gameName)) {
      return `"${gameName}" already added to tracking list!`
    }

    const role = guild.roles.find((r) => r.name === roleName)
    if (role) {
      this.upsertTrackedRole(bot, guild, gameName, role)
      return `"${gameName}" added to tracking list!`
    }
    const newRole = await this.createRole(guild, roleName)
    if (!newRole) {
      return `Could not create role "${roleName}"`
    }
    this.upsertTrackedRole(bot, guild, gameName, newRole)
    return `"${gameName}" created and added to tracking list!`
  }

  async untrackGame (
    bot: TuxedoMan,
    guild: Guild,
    gameName: string
  ): Promise<string> {
    const { trackedRoles } = await this.getRolesForGuild(bot, guild)

    if (!trackedRoles.has(gameName)) {
      return `"${gameName}" not in tracking list!`
    }

    await this.removeTrackedRole(bot, guild, trackedRoles.get(gameName))

    return `"${gameName}" untracked!`
  }

  private async upsertTrackedRole (
    bot: TuxedoMan,
    guild: Guild,
    game: string,
    role: Role,
    type?: CommonRoleType
  ): Promise<DatabaseObject> {
    const gameRole = await this.getRoleRecordForGame(bot, guild, game)
    if (gameRole) {
      return gameRole.save({
        role: role.id
      })
    } else {
      const gameRole = await bot.dbm.newObject('role', {
        guild: guild.id,
        role: role.id,
        game,
        type
      })
        .save()

      await this.checkAllMembers(bot, guild)
      return gameRole
    }
  }

  private clearRole (
    bot: TuxedoMan,
    guild: Guild,
    role?: Role
  ): Promise<void> | void {
    if (role) {
      return Promise.all(guild.members.map(async (member) => {
        if (member.bot || !member.roles.includes(role.id)) {
          return
        }

        await this.removeRole(member, role.id)
        await this.checkMember(bot, member)
      })).then(() => Promise.resolve())
    }
  }

  private createRole (guild: Guild, name: string): Promise<Role> {
    return guild.createRole({ name, hoist: true })
  }

  private removeTrackedRole (
    bot: TuxedoMan,
    guild: Guild,
    gameRole?: DatabaseObject
  ): Promise<void> | void {
    if (gameRole) {
      return Promise.all([
        gameRole.delete(),
        this.clearRole(bot, guild, guild.roles.get(gameRole.get('role')))
      ]).then(() => Promise.resolve())
    }
  }

  private removeRole (member: Member, id?: string): Promise<void> | void {
    if (id && member.roles.includes(id)) {
      return member.removeRole(id)
    }
  }

  private addRole (member: Member, id?: string): Promise<void> | void {
    if (id) {
      return member.addRole(id)
    }
  }
}
