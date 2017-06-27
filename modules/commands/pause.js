const func = require('../common.js')

module.exports = {
  command: 'pause',
  description: 'Pauses your shit',
  parameters: [],
  rank: 1,
  execute: function (msg) {
    let client = func.getClient(msg.guild.id)
    let str = ''
    if (client.paused) {
      str = 'Playback is already paused!'
      return {promise: msg.reply(str), content: str}
    } else {
      client.paused = true
      if (client.isPlaying) {
        client.encoder.voiceConnection.getEncoderStream().cork()
      }
      str = 'Pausing!'
      return {promise: msg.reply(str), content: str}
    }
  }
}
