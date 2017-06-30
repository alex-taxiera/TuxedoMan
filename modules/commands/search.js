const func = require('../common.js')
const music = require('../music.js')
const db = require('../database.js')

module.exports = {
  command: 'search',
  description: 'Searches for a video or playlist on YouTube and adds it to the queue',
  parameters: ['query'],
  rank: 1,
  execute: function (msg, params) {
    let fullParam = params.join(' ')
    func.log(`search video on${db.getGuildInfo(msg.guild.id).guild.name}`)
    return music.searchVideo(msg, fullParam)
  }
}
