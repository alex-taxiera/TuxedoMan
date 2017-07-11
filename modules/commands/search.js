const music = require('../music.js')

module.exports = {
  command: 'search',
  description: 'Searches for a video or playlist on YouTube and adds it to the queue',
  parameters: ['query'],
  rank: 1,
  execute: function (msg, params) {
    let fullParam = params.join(' ')
    return music.searchVideo(msg, fullParam)
  }
}
