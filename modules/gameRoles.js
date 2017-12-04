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
    let { active, roles, other } = db.getGameRolesInfo(id)
    if (active && member.previousGameName !== member.gameName) {
      // let user roles be all the roles that are not 'game roles'
      let userRoles = member.roles.map((role) => { return role.id })
      .filter((role) => {
        return !roles.includes(role) && role !== other.role
      })

      // add proper game role if found, or other role if active
      let role = guild.roles.find((r) => r.name === member.gameName)
      if (role && roles.includes(role.id)) {
        userRoles.push(role.id)
      } else if (other.active && member.gameName) {
        userRoles.push(other.role)
      }

      member.setRoles(userRoles)
    }
  },
  checkRole: function (id, roleId) {
    let { roles, other } = db.getGameRolesInfo(id)
    if (roles.includes(roleId)) {
      roles.splice(roles.indexOf(roleId), 1)
    } else if (other.role === roleId) {
      other.active = false
      other.role = ''
    }
  },
  addRole: async function (msg, fullParam, addOther = false) {
    let id = msg.guild.id
    let { active, roles, other } = db.getGameRolesInfo(id)
    let str = ''

    let exists = msg.guild.roles.find((r) => r.name === fullParam)
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
        if (!roles.find((r) => r === exists.id)) {
          roles.push(exists.id)
          if (active) {
            checkGame(id, roles, exists.id)
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
            other.role = role.id
            if (other.active) {
              module.exports.sweepGames(id)
            }
          } else {
            roles.push(role.id)
            if (active) {
              checkGame(id, roles, role.id)
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
    let { active, roles } = db.getGameRolesInfo(id)
    let str = ''

    let role = msg.guild.roles.find((r) => r.name === fullParam)
    if (role) {
      let index = roles.findIndex((r) => r === role.id)
      if (index > -1) {
        roles.splice(index, 1)
        str = `"${fullParam} removed!"`
        if (active) {
          checkGame(id, roles, role.id)
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
    let { active, roles, other } = db.getGameRolesInfo(id)

    roles = roles.filter((role) => {
      return guild.roles.find((r) => r.id === role)
    })
    if (!guild.roles.find((role) => role.id === other.role)) {
      other.active = false
      other.role = ''
    }

    if (!active) {
      members.forEach((member) => {
        if (!member.bot) {
          if (member.hasRole(other.role)) {
            unassignRole(member, other.role)
          }
          roles.forEach((gameRole, i) => {
            if (member.hasRole(gameRole)) {
              unassignRole(member, gameRole)
            }
          })
        }
      })
    } else {
      members.forEach((member) => {
        if (!member.bot) {
          roles.forEach((gameRole, i) => {
            let role = guild.roles.find((r) => r.id === gameRole)
            if (!member.hasRole(role) && member.gameName === role.name) {
              assignRole(member, role)
              if (member.hasRole(other.role)) {
                unassignRole(member, other.role)
              }
            } else if (member.hasRole(role) && member.gameName !== role.name) {
              unassignRole(member, role)
            }
          })
          if (other.active && member.gameName) {
            assignRole(member, other.role)
          } else if (member.hasRole(other.role) && !member.gameName) {
            unassignRole(member, other.role)
          }
        }
      })
    }
  }
}

async function assignRole (member, role) {
  await member.assignRole(role)
  .catch((e) => { func.log('cannot assign role', 'red', e) })
}

async function unassignRole (member, role) {
  await member.unassignRole(role)
  .catch((e) => { func.log('cannot unassign role', 'red', e) })
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
