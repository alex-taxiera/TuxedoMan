const func = require('./common.js')
const main = require('../TuxedoMan.js')
const db = require('./database.js')

module.exports = {
  addRole: function (msg, fullParam) {
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''
    let exists = msg.guild.roles.find(r => r.name === fullParam)
    if (exists) {
      if (!client.gameRoles.roles.find(r => r === exists.id)) {
        client.gameRoles.roles.push(exists.id)
        module.exports.checkGame(client, exists.id)
        db.updateGuilds(client)
        str = `Added "${fullParam}" to game roles!`
        return {promise: msg.reply(str), content: str}
      } else {
        str = `"${fullParam}" already in list!`
        return {promise: msg.reply(str), content: str}
      }
    } else {
      str = msg.guild.createRole()
      .then((role) => {
        role.commit(fullParam, 0, true)
        .then(() => {
          client.gameRoles.roles.push(role.id)
          module.exports.checkGame(client, role.id)
          db.updateGuilds(client)
          str = `"${fullParam}" created and added to game roles!`
          func.messageHandler({promise: msg.reply(str), content: str}, client)
        })
      })
      .catch((e) => {
        func.log(`cannot create role`, e)
        str = `Could not create role "${fullParam}"`
        func.messageHandler({promise: msg.reply(str), content: str}, client)
      })
    }
  },
  delRole: function (msg, fullParam) {
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''
    let role = msg.guild.roles.find(r => r.name === fullParam)
    if (role) {
      let index = client.gameRoles.roles.findIndex(r => r === role.id)
      if (index !== -1) {
        client.gameRoles.roles.splice(index, 1)
        str = `Deleted "${fullParam}" from game roles!`
        module.exports.checkGame(client, role.id)
        db.updateGuilds(client)
        return {promise: msg.reply(str), content: str}
      } else {
        str = `"${fullParam}" not in list!`
        return {promise: msg.reply(str), content: str}
      }
    } else {
      str = `"${fullParam}" does not exist in this guild!`
      return {promise: msg.reply(str), content: str}
    }
  },
  assignRole: function (user, role) {
    func.log(`assigning "${user.name}" ${role.name}`)
    user.assignRole(role).catch(function (e) { func.log('cannot assign role', e) })
  },
  unassignRole: function (user, role) {
    func.log(`unassigning "${user.name}" ${role.name}`)
    user.unassignRole(role).catch(function (e) { func.log('cannot unassign role', e) })
  },
  sweepGames: function (client) {
    let guild = main.bot().Guilds.get(client.guild.id)
    let members = guild.members
    let trackedRoles = client.gameRoles.roles

    for (let i = 0; i < guild.member_count; i++) {
      for (let j = 0; j < trackedRoles.length; j++) {
        let role = guild.roles.find(r => r.id === trackedRoles[j])
        if (role) {
          if ((!client.gameRoles.active && members[i].hasRole(role)) ||
          (members[i].hasRole(role) && role.name !== members[i].gameName)) {
            module.exports.unassignRole(members[i], role)
          } else if (!members[i].hasRole(role) && role.name === members[i].gameName) {
            module.exports.assignRole(members[i], role)
          }
        } else {
          if (client.gameRoles.roles.find(r => r === trackedRoles[j])) {
            client.gameRoles.roles.splice(j, 1)
          }
        }
      }
    }
  },
  checkGame: function (client, roleId) {
    let guild = main.bot().Guilds.get(client.guild.id)
    let role = guild.roles.find(r => r.id === roleId)
    if (client.gameRoles.roles.find(r => r === role.id)) {
      for (let i = 0; i < guild.members.count; i++) {
        if (guild.members[i].gameName === role.name) {
          module.exports.assignRole(guild.members[i], role)
        }
      }
    } else {
      for (let i = 0; i < guild.members.count; i++) {
        if (guild.members[i].hasRole(role)) {
          module.exports.unassignRole(guild.members[i], role)
        }
      }
    }
  }
}
