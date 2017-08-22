const func = require('./common.js')
const db = require('./database.js')
const Response = require('./classes/Response.js')

module.exports = {
  initialize: function (guilds) {
    guilds.forEach((guild) => {
      module.exports.sweepGames(guild.id)
    })
  },
  checkMember: async function (id, guild, member) {
    let gameRolesInfo = db.getGameRolesInfo(id)
    if (gameRolesInfo.active) {
      let roles = gameRolesInfo.roles

      let role = guild.roles.find((r) => r.name === member.previousGameName)
      if (role && roles.includes(role.id) && member.hasRole(role)) {
        await unassignRole(member, role)
      } else if (!member.gameName && member.hasRole(gameRolesInfo.other.role)) {
        await unassignRole(member, gameRolesInfo.other.role)
      }

      role = guild.roles.find((r) => r.name === member.gameName)
      if (role && roles.includes(role.id) && !member.hasRole(role)) {
        await assignRole(member, role)
      } else if (gameRolesInfo.other.active && member.gameName) {
        await assignRole(member, gameRolesInfo.other.role)
      }
    }
  },
  checkRole: function (id, roleId) {
    let gameRolesInfo = db.getGameRolesInfo(id)
    if (gameRolesInfo.roles.includes(roleId)) {
      gameRolesInfo.roles.splice(gameRolesInfo.roles.indexOf(roleId), 1)
    } else if (gameRolesInfo.other.role === roleId) {
      gameRolesInfo.other.active = false
      gameRolesInfo.other.role = ''
    }
  },
  addRole: async function (msg, fullParam, addOther = false) {
    let id = msg.guild.id
    let gameRolesInfo = db.getGameRolesInfo(id)
    let gameRoles = gameRolesInfo.roles
    let active = gameRolesInfo.active
    let other = gameRolesInfo.other
    let str = ''

    let exists = msg.guild.roles.find((r) => r.name === fullParam)
    if (exists) {
      if (addOther) {
        if (other.role !== exists.id) {
          gameRolesInfo.other.role = exists.id
          if (other.active) {
            checkOther(id, gameRolesInfo.other, gameRolesInfo.roles)
          }
          str = `"${fullParam}" set to other role!`
        } else {
          str = `"${fullParam}" already added!`
        }
      } else {
        if (!gameRoles.find((r) => r === exists.id)) {
          gameRolesInfo.roles.push(exists.id)
          if (active) {
            checkGame(id, gameRoles, exists.id)
          }
          str = `"${fullParam}" added!`
        } else {
          str = `"${fullParam}" already added!`
        }
      }
    } else {
      str = await msg.guild.createRole()
      .then((role) => {
        return role.commit(fullParam, 0, true)
        .then(() => {
          if (addOther) {
            gameRolesInfo.other.role = role.id
            if (gameRolesInfo.other.active) {
              module.exports.sweepGames(id)
            }
          } else {
            gameRolesInfo.roles.push(role.id)
            if (active) {
              checkGame(id, gameRoles, role.id)
            }
          }
          return `"${fullParam}" created and added!`
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
          checkGame(id, gameRoles, role.id)
        }
      } else {
        str = `"${fullParam}" not in list!`
      }
    } else {
      str = `"${fullParam}" does not exist in this guild!`
    }
    return new Response(msg, str)
  },
  sweepGames: function (id) {
    let guild = require('../TuxedoMan.js').Guilds.get(id)
    let members = guild.members
    let gameRolesInfo = db.getGameRolesInfo(id)

    gameRolesInfo.roles.forEach((gameRole, i) => {
      if (!guild.roles.find((r) => r.id === gameRole)) {
        gameRolesInfo.roles[i] = null
      }
    })
    gameRolesInfo.roles = gameRolesInfo.roles.filter((role) => {
      return role !== null
    })
    if (!guild.roles.find((role) => role.id === gameRolesInfo.other.role)) {
      gameRolesInfo.other.active = false
      gameRolesInfo.other.role = ''
    }

    if (!gameRolesInfo.active) {
      members.forEach((member) => {
        if (!member.bot) {
          if (member.hasRole(gameRolesInfo.other.role)) {
            unassignRole(member, gameRolesInfo.other.role)
          }
          gameRolesInfo.roles.forEach((gameRole, i) => {
            if (member.hasRole(gameRole)) {
              unassignRole(member, gameRole)
            }
          })
        }
      })
    } else {
      members.forEach((member) => {
        if (!member.bot) {
          gameRolesInfo.roles.forEach((gameRole, i) => {
            let role = guild.roles.find((r) => r.id === gameRole)
            if (!member.hasRole(role) && member.gameName === role.name) {
              assignRole(member, role)
              if (member.hasRole(gameRolesInfo.other.role)) {
                unassignRole(member, gameRolesInfo.other.role)
              }
            } else if (member.hasRole(role) && member.gameName !== role.name) {
              unassignRole(member, role)
            }
          })
          if (gameRolesInfo.other.active && member.gameName) {
            assignRole(member, gameRolesInfo.other.role)
          } else if (member.hasRole(gameRolesInfo.other.role) && !member.gameName) {
            unassignRole(member, gameRolesInfo.other.role)
          }
        }
      })
    }
  }
}

async function assignRole (member, role) {
  await member.assignRole(role).catch((e) => { func.log('cannot assign role', 'red', e) })
}

async function unassignRole (member, role) {
  await member.unassignRole(role).catch((e) => { func.log('cannot unassign role', 'red', e) })
}

function checkOther (id, other, gameRoles) {
  let guild = require('../TuxedoMan.js').Guilds.get(id)
  if (other.active) {
    guild.members.forEach((member) => {
      if (!member.bot && member.gameName) {
        for (let i = 0; i < gameRoles.length; i++) {
          if (member.hasRole(gameRoles[i])) {
            return
          }
        }
        assignRole(member, other.role)
      }
    })
  } else {
    guild.members.forEach((member) => {
      if (member.hasRole(other)) {
        unassignRole(member, other)
      }
    })
  }
}

function checkGame (id, gameRoles, roleId) {
  let guild = require('../TuxedoMan.js').Guilds.get(id)

  let role = guild.roles.find((r) => r.id === roleId)
  if (gameRoles.includes(role.id)) {
    guild.members.forEach((member) => {
      if (!member.bot && member.gameName === role.name) {
        assignRole(member, role)
      }
    })
  } else {
    guild.members.forEach((member) => {
      if (member.hasRole(role)) {
        unassignRole(member, role)
      }
    })
  }
}
