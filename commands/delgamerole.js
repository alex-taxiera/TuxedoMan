const func = require('../common.js')
module.exports = {
  command: 'delgamerole',
  description: 'Delete game roles',
  parameters: ['role name'],
  rank: 2,
  execute: function (msg, params) {
    var fullParam = func.getFullParam(params)
    var client = func.getClient(msg.guild.id)
    var str = ''
    var role = msg.guild.roles.find(r => r.name === fullParam)
    if (role) {
      var index = client.gameRoles.roles.findIndex(r => r === role.id)
      if (index !== -1) {
        client.gameRoles.roles.splice(index, 1)
        str = `Deleted "${fullParam}" from game roles!`
        func.checkGame(client, role.id)
        func.writeChanges()
        return {promise: msg.reply(str), content: str}
      } else {
        str = `"${fullParam}" not in list!`
        return {promise: msg.reply(str), content: str}
      }
    } else {
      str = `"${fullParam}" does not exist in this guild!`
      return {promise: msg.reply(str), content: str}
    }
  }
}
