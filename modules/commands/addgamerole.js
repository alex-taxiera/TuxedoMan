const gameRoles = require('../gameRoles.js')
const Command = require('../classes/Command.js')
const Response = require('../classes/Response.js')

module.exports = new Command(
  'addgamerole',
  'Add game roles',
  ['role name, should be as game appears on discord statuses'],
  'VIP',
  async function (msg, params) {
    let fullParam = params.join(' ')
    let str
    if (fullParam.length > 100) {
      str = 'Role name is too long!'
    } else {
      str = await gameRoles.addRole(msg, fullParam)
    }
    return new Response(msg, str)
  }
)
