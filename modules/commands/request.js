const music = require('../music.js')
const Command = require('./command.js')

module.exports = new Command(
  'request',
  'Adds the requested video to the playlist queue',
  ['video URL, video ID, playlist URL or alias'],
  'Anyone in Voice',
  false,
  function (msg, params) {
    let regExp = /^.*(youtu.be\/|list=)([^#&?]*).*/
    let match = params[0].match(regExp)

    if (match && match[2]) {
      return music.queuePlaylist(match[2], msg)
    } else {
      return music.addToQueue(params[0], msg)
    }
  }
)
