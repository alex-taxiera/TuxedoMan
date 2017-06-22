const func = require('../common.js')
const cmd = require('../commands.js')
module.exports = {
  command: 'eval',
  description: 'dev',
  parameters: ['stuff'],
  rank: 4,
  hidden: true,
  execute: function (msg, params) {
    var client = func.getClient(msg.guild.id)
    var fullParam = params.join(' ')
    try {
      eval(fullParam)
    } catch (e) {
      func.log(`could not eval "${fullParam}"`, e.message)
    }
  }
}
