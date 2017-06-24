const func = require('../common.js')
const music = require('../music.js')

module.exports = {
  command: 'search',
  description: 'Searches for a video or playlist on YouTube and adds it to the queue',
  parameters: ['query'],
  rank: 1,
  execute: function (msg, params) {
    let fullParam = params.join(' ')
    func.log(`search video on${func.getClient(msg.guild.id).guild.name}`)
    return music.searchVideo(msg, fullParam)
  }
}
