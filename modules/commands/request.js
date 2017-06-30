const func = require('../common.js')
const music = require('../music.js')
const db = require('../database.js')

module.exports = {
  command: 'request',
  description: 'Adds the requested video to the playlist queue',
  parameters: ['video URL, video ID, playlist URL or alias'],
  rank: 1,
  execute: function (msg, params) {
    let regExp = /^.*(youtu.be\/|list=)([^#&?]*).*/
    let match = params[0].match(regExp)

    if (match && match[2]) {
      return music.queuePlaylist(match[2], msg)
    } else {
      func.log(`request video on ${db.getGuildInfo(msg.guild.id).guild.name}`)
      return music.addToQueue(params[0], msg)
    }
  }
}
