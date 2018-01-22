const Permission = require('../classes/Permission.js')
const Response = require('../classes/Response.js')

module.exports = new Permission(
  'Admin',
  function (info, member, msg) {
    require('../../TuxedoMan.js').getOAuthApplication()
    .then((app) => {
      if (member.id === app.owner.id) {
        return true
      } else {
        return false
      }
    })
  },
  function (msg) {
    let str = 'Must be bot owner!'
    return new Response(msg, str)
  }
)
