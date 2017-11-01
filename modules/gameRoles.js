const func = require('./common.js')
const db = require('./database.js')
const Response = require('./classes/Response.js')

module.exports = {
  initialize: function (guilds) {
    guilds.forEach((guild) => {
      module.exports.sweepGames(guild.id)
    })
  },
  checkMember: function (id, guild, member) {
    let gameRolesInfo = db.getGameRolesInfo(id)
    if (gameRolesInfo.active && member.previousGameName !== member.gameName) {
      let roles = gameRolesInfo.roles
<<<<<<< HEAD
      func.log('user presence update', 'yellow')
      console.log(member.nick)
=======
>>>>>>> 87057c287a5031b577cd095e6cc10d0f3d9bc72a
      func.log('previous user game', 'green')
      console.log(member.previousGameName)
      func.log('current user game', 'green')
      console.log(member.gameName)
      func.log('current game roles', 'green')
      guild.roles.forEach((role) => { if (roles.includes(role.id)) { console.log(role.name) } })

      let userRoles = member.roles.map((role) => { return role.id })
      func.log('current user roles', 'green')
      guild.roles.forEach((role) => { if (userRoles.includes(role.id)) { console.log(role.name) } })

      let role = guild.roles.find((r) => r.name === member.previousGameName)
      if (role) { func.log('previous game match', 'green') }
      if (role && roles.includes(role.id) && member.hasRole(role.id)) {
        func.log(`filtering ${role.name}`, 'yellow')
        userRoles = userRoles.filter((userRole) => { return userRole !== role.id })
      } else if (!member.gameName && member.hasRole(gameRolesInfo.other.role)) {
        func.log('filtering other role', 'yellow')
        userRoles = userRoles.filter((userRole) => { return userRole !== gameRolesInfo.other.role })
      }

      func.log('user roles after filters', 'green')
      guild.roles.forEach((role) => { if (userRoles.includes(role.id)) { console.log(role.name) } })

      role = guild.roles.find((r) => r.name === member.gameName)
      if (role) { func.log('current game match', 'green') }
      if (role && roles.includes(role.id) && !member.hasRole(role.id)) {
        func.log(`pushing ${role.name}`, 'yellow')
        userRoles.push(role.id)
      } else if (gameRolesInfo.other.active && member.gameName) {
        func.log('pushing other role', 'yellow')
        userRoles.push(gameRolesInfo.other.role)
      }

      func.log('user roles after pushes', 'green')
      guild.roles.forEach((role) => { if (userRoles.includes(role.id)) { console.log(role.name) } })

      member.setRoles(userRoles)
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
