const db = require('../database.js')
const music = require('../music.js')

module.exports = {
  command: 'play',
  description: 'Resumes paused/stopped playback',
  parameters: [],
  rank: 1,
  execute: function (msg) {
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''
    if (!client.isPlaying && client.queue.length === 0) {
      if (client.autoplay) {
        client.paused = false
        music.autoQueue(client)
        str = 'Starting!'
        return {promise: msg.reply(str), content: str}
      } else {
        str = 'Turn autoplay on, or use search or request to pick a song!'
        return {promise: msg.reply(str), content: str}
      }
    } else if (client.paused) {
      client.paused = false
      if (client.isPlaying) {
        client.encoder.voiceConnection.getEncoderStream().uncork()
      }
      str = 'Resuming!'
      return {promise: msg.reply(str), content: str}
    } else {
      str = 'Playback is already running'
      return {promise: msg.reply(str), content: str}
    }
  }
}
