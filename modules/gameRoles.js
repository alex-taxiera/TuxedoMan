const func = require('./common.js')
const main = require('../TuxedoMan.js')
const db = require('./database.js')
const Response = require('./response.js')

module.exports = {
  addRole: async function (msg, fullParam) {
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''

    let exists = msg.guild.roles.find((r) => r.name === fullParam)
    if (exists) {
      if (!client.gameRoles.roles.find((r) => r === exists.id)) {
        client.gameRoles.roles.push(exists.id)
        module.exports.checkGame(client, exists.id)
        db.updateGuilds(client)

        str = `Added "${fullParam}" to game roles!`
      } else {
        str = `"${fullParam}" already in list!`
      }
    } else {
      str = await msg.guild.createRole()
      .then((role) => {
        return role.commit(fullParam, 0, true)
        .then(() => {
          client.gameRoles.roles.push(role.id)
          module.exports.checkGame(client, role.id)
          db.updateGuilds(client)

          return `"${fullParam}" created and added to game roles!`
        })
      })
      .catch((e) => {
        func.log(`cannot create role`, 'red', e)

        return `Could not create role "${fullParam}"`
      })
    }
    func.messageHandler(new Response(msg, str), client)
  },
  delRole: function (msg, fullParam) {
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''

    let role = msg.guild.roles.find((r) => r.name === fullParam)
    if (role) {
      let index = client.gameRoles.roles.findIndex((r) => r === role.id)
      if (index > -1) {
        client.gameRoles.roles.splice(index, 1)
        module.exports.checkGame(client, role.id)
        db.updateGuilds(client)
        return { promise: msg.reply(str), content: str }
      } else {
        str = `"${fullParam}" not in list!`
        return { promise: msg.reply(str), content: str }
      }
    } else {
      str = `"${fullParam}" does not exist in this guild!`
      return { promise: msg.reply(str), content: str }
    }
  },
  assignRole: function (user, role) {
    user.assignRole(role).catch((e) => { func.log('cannot assign role', 'red', e) })
  },
  unassignRole: function (user, role) {
    user.unassignRole(role).catch((e) => { func.log('cannot unassign role', 'red', e) })
  },
  sweepGames: function (client) {
    let guild = main.bot().Guilds.get(client.guild.id)
    let members = guild.members
    let trackedRoles = client.gameRoles.roles

    members.forEach((member) => {
      trackedRoles.forEach((trackedRole, i) => {
        let role = guild.roles.find((r) => r.id === trackedRole)
        if (role) {
          if ((!client.gameRoles.active && member.hasRole(role)) ||
          (member.hasRole(role) && role.name !== member.gameName)) {
            module.exports.unassignRole(member, role)
          } else if (!member.hasRole(role) && role.name === member.gameName) {
            module.exports.assignRole(member, role)
          }
        } else {
          client.gameRoles.roles.splice(i, 1)
        }
      })
    })
  },
  checkGame: function (client, roleId) {
    let guild = main.bot().Guilds.get(client.guild.id)

    let role = guild.roles.find((r) => r.id === roleId)
    if (client.gameRoles.roles.includes(role.id)) {
      guild.members.forEach((member) => {
        if (member.gameName === role.name) {
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
