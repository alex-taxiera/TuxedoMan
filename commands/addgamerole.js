const gameRoles = require('../gameRoles.js')

module.exports = {
  command: 'addgamerole',
  description: 'Add game roles',
  parameters: ['role name, should be as game appears on discord statuses'],
  rank: 2,
  execute: function (msg, params) {
    var fullParam = params.join(' ')
    return gameRoles.addRole(msg, fullParam)
  }
}
