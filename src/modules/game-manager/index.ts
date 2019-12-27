import {
  Member,
  Guild,
  OldPresence,
  Role
} from 'eris'
import {
  DatabaseObject
} from 'eris-boiler'
import {
  ExtendedMap
} from 'eris-boiler/util'

import { TuxedoMan } from '../tuxedoman'

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
  constructor (private readonly roleNames: CommonRoleNames = {
    playing: 'Other Games',
    listening: 'Listening',
    watching: 'Watching',
    streaming: 'Streaming'
  }) { }

  public async checkAllMembers (bot: TuxedoMan, guild: Guild): Promise<void> {
    await Promise.all(
      guild.members.map((member) => this.checkMember(bot, member))
    )
  }

  public async checkMember (
    bot: TuxedoMan,
    member: Member,
    oldPresence?: OldPresence
  ): Promise<void> {
    const activity = member.activities?.find((a) => a.type > -1 && a.type < 4)
    const oldGame = oldPresence?.activities
      ?.find((a) => a.type > -1 && a.type < 4)

    if (member.bot || activity?.id === oldGame?.id) {
      return
    }

    const {
      commonRoles,
      trackedRoles
    } = await this.getRolesForGuild(bot, member.guild)
    let toAdd = ''

    if (activity !== undefined) {
      const role = member.guild.roles
        .find((role) => role.name === activity.name) // FIXME: use saved ID instead of name
      const [ guildOptions ] = await bot.dbm.newQuery('guild')
        .equalTo('id', member.guild.id)
        .find()

      switch (activity.type) {
        case 0:
          if (trackedRoles.has(role?.id)) {
            toAdd = role.id
          } else if (guildOptions.get('game')) {
            toAdd = commonRoles.playing?.get('role')
          }
          break
        case 1:
          if (guildOptions.get('stream')) {
            toAdd = commonRoles.streaming?.get('role')
          }
          break
        case 2:
          if (guildOptions.get('listen')) {
            toAdd = commonRoles.listening?.get('role')
          }
          break
        case 3:
          if (guildOptions.get('watch')) {
            toAdd = commonRoles.watching?.get('role')
          }
          break
      }
    }

    if (toAdd) {
      this.addRole(member, toAdd)
    }

    console.log('toAdd :', toAdd)
    console.log('member.roles :', member.roles)

    await Promise.all(
      Object.values(commonRoles).concat(Array.from(trackedRoles.values()))
        .map((role) => {
          console.log('role :', role)
          return role?.get('role') === toAdd
            ? Promise.resolve()
            : this.removeRole(member, role?.get('role'))
        })
    )
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

  public async checkRole (
    bot: TuxedoMan,
    guild: Guild,
    role: Role
  ): Promise<void> {
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

  public async getRolesForGuild (
    bot: TuxedoMan,
    guild: Guild
  ): Promise<GuildGameRoles> {
    const gameRoles = await bot.dbm.newQuery('role')
      .equalTo('guild', guild.id)
      .find()

    const commonRoles: CommonGameRoles = this.getEmptyCommonRoles()
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

  public getRoleFromRecord (
    bot: TuxedoMan,
    gameRole: DatabaseObject
  ): Role | Promise<void> {
    const guild = bot.guilds.get(gameRole.get('guild'))
    if (guild?.roles.has(gameRole.get('role'))) {
      return (guild.roles.get(gameRole.get('role')) as Role)
    }

    return gameRole.delete()
  }

  public async startup (bot: TuxedoMan): Promise<void> {
    await Promise.all(bot.guilds.map(async (guild) => {
      await Promise.all(
        guild.roles.map((role) => this.checkRole(bot, guild, role))
      )
      return Promise.all(
        guild.members.map((member) => this.checkMember(bot, member))
      )
    }))
  }

  public async setupMiscRoles (bot: TuxedoMan, guild: Guild): Promise<void> {
    const { commonRoles } = await this.getRolesForGuild(bot, guild)
    await Promise.all(
      (Object.keys(commonRoles) as Array<CommonRoleType>).map(async (key) => {
        if (!commonRoles[key]) {
          const newRole = await this.createRole(bot, guild, this.roleNames[key])
          await this.upsertTrackedRole(bot, guild, key, newRole, key)
        }
      })
    )
    await this.checkAllMembers(bot, guild)
  }

  public async trackGame (
    bot: TuxedoMan,
    guild: Guild,
    roleName: string,
    gameName: string
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
    gameName: string
  ): Promise<string> {
    const { trackedRoles } = await this.getRolesForGuild(bot, guild)

    if (!trackedRoles.has(gameName)) {
      return 'Not found in tracking list!'
    }

    await this.removeTrackedRole(bot, guild, trackedRoles.get(gameName))

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

  private async createRole (
    bot: TuxedoMan,
    guild: Guild,
    name: string
  ): Promise<Role> {
    const {
      trackedRoles
    } = await this.getRolesForGuild(bot, guild)
    const [ lowRole ] = trackedRoles.size === 0
      ? (guild.members.get(bot.user.id) as Member).roles
        .map((id) => guild.roles.get(id) as Role)
        .sort((a, b) => a.position - b.position)
      : Array.from(trackedRoles.values())
        .map((dbo) => guild.roles.get(dbo.get('role')) as Role)
        .filter((r) => r)
        .sort((a, b) => a.position - b.position)

    const role = await guild.createRole({ name, hoist: true })
    if (lowRole) {
      await role.editPosition(lowRole.position - 1)
    }

    return role
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
