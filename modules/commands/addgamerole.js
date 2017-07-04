const gameRoles = require('../gameRoles.js')

module.exports = {
  command: 'addgamerole',
  description: 'Add game roles',
  parameters: ['role name, should be as game appears on discord statuses'],
  rank: 2,
  execute: function (msg, params) {
    let fullParam = params.join(' ')
    if (fullParam.length > 100) {
      let str = 'Role name is too long!'
      return {promise: msg.reply(str), content: str}
    } else {
      return gameRoles.addRole(msg, fullParam)
    }
  }
}
