const Permission = require('../classes/Permission.js')
const Response = require('../classes/Response.js')

module.exports = new Permission(
  'Owner',
  function (info, member, msg) {
    if (member.id === member.guild.ownerID) {
      return true
    }
    return false
  },
  function (msg) {
    let str = 'Must be guild owner!'
    return new Response(msg, str)
  }
)
