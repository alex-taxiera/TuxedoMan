const gameRoles = require('../gameRoles.js')

module.exports = {
  command: 'delgamerole',
  description: 'Delete game roles',
  parameters: ['role name'],
  rank: 2,
  execute: function (msg, params) {
    let fullParam = params.join(' ')
    return gameRoles.delRole(msg, fullParam)
  }
}
