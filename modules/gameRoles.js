const func = require('./common.js')
const db = require('./database.js')
const Response = require('./classes/Response.js')

module.exports = {
  initialize: function (guilds) {
    guilds.forEach((guild) => {
      module.exports.sweepGames(guild.id)
    })
  },
  checkGameRoles: function (id, roleId) {
    let roles = db.getGameRolesInfo(id).roles
    if (roles.includes(roleId)) {
      roles.splice(roles.indexOf(roleId), 1)
    }
  },
  addRole: async function (msg, fullParam) {
    let id = msg.guild.id
    let gameRolesInfo = db.getGameRolesInfo(id)
    let gameRoles = gameRolesInfo.roles
    let active = gameRolesInfo.active
    let str = ''

    let exists = msg.guild.roles.find((r) => r.name === fullParam)
    if (exists) {
      if (!gameRoles.find((r) => r === exists.id)) {
        gameRolesInfo.roles.push(exists.id)
        if (active) {
          module.exports.checkGame(id, gameRoles, exists.id)
        }
        str = `Added "${fullParam}" to game roles!`
      } else {
        str = `"${fullParam}" already in list!`
      }
    } else {
      str = await msg.guild.createRole()
      .then((role) => {
        return role.commit(fullParam, 0, true)
        .then(() => {
          gameRolesInfo.roles.push(role.id)
          if (active) {
            module.exports.checkGame(id, gameRoles, role.id)
          }
          return `"${fullParam}" created and added to game roles!`
        })
      })
      .catch((e) => {
        func.log(`cannot create role`, 'red', e)

        return `Could not create role "${fullParam}"`
      })
    }
    func.messageHandler(new Response(msg, str))
  },
  delRole: function (msg, fullParam) {
    let id = msg.guild.id
    let gameRolesInfo = db.getGameRolesInfo(id)
    let gameRoles = gameRolesInfo.roles
    let active = gameRolesInfo.active
    let str = ''

    let role = msg.guild.roles.find((r) => r.name === fullParam)
    if (role) {
      let index = gameRoles.findIndex((r) => r === role.id)
      if (index > -1) {
        gameRolesInfo.roles.splice(index, 1)
        str = `"${fullParam} removed!"`
        if (active) {
          module.exports.checkGame(id, gameRoles, role.id)
        }
      } else {
        str = `"${fullParam}" not in list!`
      }
    } else {
      str = `"${fullParam}" does not exist in this guild!`
    }
    return new Response(msg, str)
  },
  assignRole: function (user, role) {
    user.assignRole(role).catch((e) => { func.log('cannot assign role', 'red', e) })
  },
  unassignRole: function (user, role) {
    user.unassignRole(role).catch((e) => { func.log('cannot unassign role', 'red', e) })
  },
  sweepGames: function (id) {
    let guild = require('../TuxedoMan.js').Guilds.get(id)
    let members = guild.members
    let gameRolesInfo = db.getGameRolesInfo(id)

    members.forEach((member) => {
      if (!member.bot) {
        gameRolesInfo.roles.forEach((gameRole, i) => {
          let role = guild.roles.find((r) => r.id === gameRole)
          if (role) {
            if ((!gameRolesInfo.active && member.hasRole(role)) ||
            (member.hasRole(role) && role.name !== member.gameName)) {
              module.exports.unassignRole(member, role)
            } else if (!member.hasRole(role) && role.name === member.gameName) {
              module.exports.assignRole(member, role)
            }
          } else {
            gameRolesInfo.roles[i] = null
          }
        })
      }
    })
  },
  checkGame: function (id, gameRoles, roleId) {
    let guild = require('../TuxedoMan.js').Guilds.get(id)

    let role = guild.roles.find((r) => r.id === roleId)
    if (gameRoles.includes(role.id)) {
      guild.members.forEach((member) => {
        if (!member.bot && member.gameName === role.name) {
          module.exports.assignRole(member, role)
        }
      })
    } else {
      guild.members.forEach((member) => {
        if (member.hasRole(role)) {
          module.exports.unassignRole(member, role)
        }
      })
    }
  }
}
