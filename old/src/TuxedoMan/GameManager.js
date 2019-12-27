class GameManager {
  constructor () {
    const {
      gameRole,
      listenRole,
      watchRole,
      streamRole
    } = process.env
    this.ROLES = {
      gameRole,
      listenRole,
      watchRole,
      streamRole
    }
  }

  async checkMember (bot, member, oldGame) {
    if (member.bot || (member.game && oldGame && member.game.name === oldGame.name)) {
      return
    }

    const trackedRoles = await this.getTrackedRoles(bot, member.guild.id)
    const otherRoles = this._findOtherRoles(member.guild.roles)
    for (const id of trackedRoles.concat(Object.values(otherRoles).map((val) => val.id))) {
      if (member.roles.includes(id)) {
        await this._removeRole(member, id)
      }
    }
    if (!member.game) {
      return
    }

    const { listen, watch, game, stream } = await bot.dbm.getToggles(member.guild.id)
    const { gameRole, listenRole, watchRole, streamRole } = otherRoles

    switch (member.game.type) {
      case 0:
        const role = member.guild.roles.find((role) => role.name === member.game.name)
        if (role && trackedRoles.includes(role.id)) {
          this._addRole(member, role.id)
        } else if (game && gameRole) {
          this._addRole(member, gameRole.id)
        } break
      case 1:
        if (stream && streamRole) {
          this._addRole(member, streamRole.id)
        } break
      case 2:
        if (listen && listenRole) {
          this._addRole(member, listenRole.id)
        } break
      case 3:
        if (watch && watchRole) {
          this._addRole(member, watchRole.id)
        } break
    }
  }

  async checkRole (bot, guild, role) {
    const trackedRoles = await this.getTrackedRoles(bot, guild.id)
    if (trackedRoles.includes(role.id)) {
      this._removeTrackedRole(bot, guild, trackedRoles, role)
    }
    this.updateTrackedRoles(bot, guild.id, trackedRoles)
  }

  getTrackedRoles (bot, id) {
    return bot.dbm.getSettings(id)
      .then((val) => val.trackedRoles || [])
  }

  async initialize (bot, guilds) {
    guilds.forEach(async (guild) => {
      const trackedRoles = await this.getTrackedRoles(bot, guild.id)
      await this.updateTrackedRoles(bot, guild.id, trackedRoles.filter((id) => guild.roles.has(id)))

      guild.members.forEach((member) => this.checkMember(bot, member))
    })
  }

  async setup (bot, guild) {
    const otherRoles = this._findOtherRoles(guild.roles)
    for (const role in this.ROLES) {
      if (!otherRoles[role]) {
        await this._createRole(guild, this.ROLES[role])
      }
    }
    guild.members.forEach((member) => this.checkMember(bot, member))
  }

  async trackGame (bot, guild, fullParam) {
    const trackedRoles = await this.getTrackedRoles(bot, guild.id)

    const role = guild.roles.find((r) => r.name === fullParam)
    if (role) {
      if (trackedRoles.includes(role.id)) {
        return `"${fullParam}" already added to tracking list!`
      }
      this._addTrackedRole(bot, guild, trackedRoles, role)
      return `"${fullParam}" added to tracking list!`
    }
    const newRole = await this._createRole(guild, fullParam)
    if (!newRole) {
      return `Could not create role "${fullParam}"`
    }
    this._addTrackedRole(bot, guild, trackedRoles, newRole)
    return `"${fullParam}" created and added to tracking list!`
  }

  async untrackGame (bot, guild, fullParam) {
    const trackedRoles = await this.getTrackedRoles(bot, guild.id)

    const role = guild.roles.find((r) => r.name === fullParam)
    if (!role) {
      return `"${fullParam}" does not exist in this guild!`
    }

    if (!trackedRoles.includes(role.id)) {
      return `"${fullParam}" not in list!`
    }
    this._removeTrackedRole(bot, guild, trackedRoles, role)

    return `"${fullParam}" removed!`
  }

  async updateTrackedRoles (bot, id, trackedRoles) {
    return bot.dbm.updateSettings(id, { trackedRoles: JSON.stringify(trackedRoles) })
  }

  /* private */
  _addTrackedRole (bot, guild, trackedRoles, role) {
    trackedRoles.push(role.id)
    this.updateTrackedRoles(bot, guild.id, trackedRoles)
    this._setRole(guild, role)
  }

  async _addRole (member, id) {
    return member.addRole(id)
      .catch(this._logger.error)
  }

  _clearRole (guild, role) {
    guild.members.forEach((member) => {
      if (member.bot || !member.roles.includes(role.id)) {
        return
      }
      this._removeRole(member, role.id)
      const { gameRole } = this._findOtherRoles(guild.roles)
      if (member.game) {
        this._addRole(member, gameRole.id)
      }
    })
  }

  async _createRole (guild, name) {
    return guild.createRole({ name, hoist: true })
      .catch(this._logger.error)
  }

  _findOtherRoles (roles) {
    return {
      gameRole: roles.find((role) => role.name === this.ROLES.gameRole),
      listenRole: roles.find((role) => role.name === this.ROLES.listenRole),
      watchRole: roles.find((role) => role.name === this.ROLES.watchRole),
      streamRole: roles.find((role) => role.name === this.ROLES.streamRole)
    }
  }

  _removeTrackedRole (bot, guild, trackedRoles, role) {
    trackedRoles.splice(trackedRoles.findIndex((r) => r === role.id), 1)
    this.updateTrackedRoles(bot, guild.id, trackedRoles)
    this._clearRole(guild, role)
  }

  _setRole (guild, role) {
    guild.members.forEach((member) => {
      if (member.bot || !member.game || member.game.name !== role.name) {
        return
      }
      const { gameRole } = this._findOtherRoles(guild.roles)
      if (member.roles.includes(gameRole.id)) {
        this._removeRole(member, gameRole.id)
      }
      this._addRole(member, role.id)
    })
  }

  async _removeRole (member, id) {
    return member.removeRole(id)
      .catch(this._logger.error)
  }
}

module.exports = GameManager
