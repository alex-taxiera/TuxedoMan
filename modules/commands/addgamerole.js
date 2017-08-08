const gameRoles = require('../gameRoles.js')
const Command = require('../classes/Command.js')
const Response = require('../classes/Response.js')

module.exports = new Command(
  'addgamerole',
  'Add game roles',
  ['role name, should be as game appears on discord statuses'],
  'VIP',
  function (msg, params) {
    let fullParam = params.join(' ')
    if (fullParam.length > 100) {
      let str = 'Role name is too long!'
      return new Response(msg, str)
    } else {
      return gameRoles.addRole(msg, fullParam)
    }
  }
)
