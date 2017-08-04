const gameRoles = require('../gameRoles.js')
const Command = require('../classes/Command.js')

module.exports = new Command(
  'delgamerole',
  'Delete game roles',
  ['role name'],
  'VIP',
  false,
  function (msg, params) {
    let fullParam = params.join(' ')
    return gameRoles.delRole(msg, fullParam)
  }
)
