const func = require('../common.js')
const cmd = require('../commands.js')
module.exports = {
  command: 'eval',
  description: 'dev',
  parameters: ['stuff'],
  rank: 4,
  execute: function (msg, params) {
    var client = func.getClient(msg.guild.id)
    var fullParam = params.join(' ')
    eval(fullParam)
  }
}
