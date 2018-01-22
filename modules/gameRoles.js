const { common } = require('./')
const database = require('./database.js')
const Response = require('./classes/Response.js')

module.exports = {
  initialize: function (guilds) {
    guilds.forEach((guild) => {
      module.exports.sweepGames(guild.id)
    })
  },
  checkMember: async function (id, guild, member, oldGame) {
    let { active, roles, other } = database.getGameRolesInfo(id)

    if (!active || !member.game) {
      for (let role of roles) {
        if (member.roles.includes(role)) {
          await unassignRole(member, role)
        }
      }
    } else {
      for (let role of roles) {
        let roleName = member.guild.roles.get(role)
        if (roleName && member.roles.includes(role) && member.game.name !== roleName.name) {
          await unassignRole(member, role)
        } else if (member.roles.includes(role)) {
          await unassignRole(member, role)
        }
      }
      let roleName = member.guild.roles.find((role) => role.name === member.game.name)
      if (roleName && roles.includes(roleName.id)) {
        await assignRole(member, roleName.id)
      } else if (other.active && !member.roles.includes(other.role)) {
        await assignRole(member, other.role)
      }
    }
    if (member.roles.includes(other.role)) {
      if (!member.game || !other.active) {
        await unassignRole(member, other.role)
      } else {
        for (let role of roles) {
          if (member.roles.includes(role)) {
            await unassignRole(member, other.role)
          }
        }
      }
    }
  },
  checkRole: function (id, roleId) {
    let { roles, other } = database.getGameRolesInfo(id)
    if (roles.includes(roleId)) {
      roles.splice(roles.indexOf(roleId), 1)
      checkGame(id, roleId)
    } else if (other.role === roleId) {
      other.active = false
      other.role = ''
    }
  },
  addRole: async function (msg, fullParam, addOther = false) {
    let id = msg.channel.guild.id
    let { roles, other } = database.getGameRolesInfo(id)
    let str = ''

    let exists = msg.channel.guild.roles.find((r) => r.name === fullParam)
    if (exists) {
      if (addOther) {
        if (other.role !== exists.id) {
          other.role = exists.id
          if (other.active) {
            checkOther(id, other, roles)
          }
          str = `"${fullParam}" set to other role!`
        } else {
          str = `"${fullParam}" already added!`
        }
      } else {
        if (!roles.includes(exists.id)) {
          roles.push(exists.id)
          checkGame(id, exists)

          str = `"${fullParam}" added!`
        } else {
          str = `"${fullParam}" already added!`
        }
      }
    } else {
      const name = fullParam
      const hoist = true
      str = await msg.channel.guild.createRole({ name, hoist })
      .then((role) => {
        if (addOther) {
          other.role = role.id
          if (other.active) {
            module.exports.sweepGames(id)
          }
        } else {
          roles.push(role.id)
          checkGame(id, role)
        }
        return `"${fullParam}" created and added!`
      })
      .catch((e) => {
        common.log(`cannot create role`, 'red', e)

        return `Could not create role "${fullParam}"`
      })
    }
    return str
  },
  delRole: function (msg, fullParam) {
    let id = msg.channel.guild.id
    let { roles } = database.getGameRolesInfo(id)
    let str = ''

    let role = msg.channel.guild.roles.find((r) => r.name === fullParam)
    if (role) {
      let index = roles.findIndex((r) => r === role.id)
      if (index > -1) {
        roles.splice(index, 1)
        str = `"${fullParam} removed!"`
        checkGame(id, role)
      } else {
        str = `"${fullParam}" not in list!`
      }
    } else {
      str = `"${fullParam}" does not exist in this guild!`
    }
    return new Response(msg, str)
  },
  sweepGames: function (id) {
    let guild = require('../TuxedoMan.js').guilds.get(id)
    let members = guild.members
    let { active, roles, other } = database.getGameRolesInfo(id)

    roles = roles.filter((role) => {
      return guild.roles.get((role))
    })
    if (roles.length === 0) {
      active = false
    }

    if (!guild.roles.get(other.role)) {
      other.active = false
      other.role = ''
    }
    members.forEach((member) => {
      if (!member.bot) {
        module.exports.checkMember(id, guild, member)
      }
    })
  }
}

async function assignRole (member, id) {
  await member.addRole(id)
  .catch((e) => { common.log('cannot assign role', 'red', e) })
}

async function unassignRole (member, id) {
  await member.removeRole(id)
  .catch((e) => { common.log('cannot unassign role', 'red', e) })
}

function checkOther (id, other, gameRoles) {
  let guild = require('../TuxedoMan.js').guilds.get(id)
  if (other.active) {
    guild.members.forEach((member) => {
      if (!member.bot && member.game) {
        for (let i = 0; i < gameRoles.length; i++) {
          if (member.roles.includes(gameRoles[i])) {
            return
          }
        }
        assignRole(member, other.role)
      }
    })
  } else {
    guild.members.forEach((member) => {
      if (member.roles.includes(other.role)) {
        unassignRole(member, other.role)
      }
    })
  }
}

function checkGame (id, role) {
  let guild = require('../TuxedoMan.js').guilds.get(id)
  let { active, roles, other } = database.getGameRolesInfo(id)

  if (roles.includes(role.id)) {
    guild.members.forEach(async (member) => {
      if (active && !member.bot && member.game && member.game.name === role.name) {
        await assignRole(member, role.id)
        await unassignRole(member, other.role)
      }
    })
  } else {
    guild.members.forEach(async (member) => {
      if (member.roles.includes(role.id)) {
        await unassignRole(member, role.id)
      }
      if (!member.bot && member.game) {
        await assignRole(member, other.role)
      }
    })
  }
}
