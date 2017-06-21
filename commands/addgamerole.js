const func = require('../common.js')
module.exports = {
  command: 'addgamerole',
  description: 'Add game roles',
  parameters: ['role name, should be as game appears on discord statuses'],
  rank: 2,
  execute: function (msg, params) {
    var fullParam = params.join(' ')
    var client = func.getClient(msg.guild.id)
    var str = ''
    var exists = msg.guild.roles.find(r => r.name === fullParam)
    if (exists) {
      if (!client.gameRoles.roles.find(r => r === exists.id)) {
        client.gameRoles.roles.push(exists.id)
        func.checkGame(client, exists.id)
        func.writeChanges()
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
          func.checkGame(client, role.id)
          func.writeChanges()
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
  }
}
