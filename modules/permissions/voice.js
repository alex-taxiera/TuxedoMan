const Permission = require('../classes/Permission.js')
const Response = require('../classes/Response.js')

module.exports = new Permission(
  'Anyone in Voice',
  function (info, member, msg) {
    let memberVoice = member.getVoiceChannel()
    let botVoice = require('../../TuxedoMan.js').voiceConnections.get(info.guild.id)
    if (memberVoice && botVoice.channelID === memberVoice.id) {
      return true
    }
    return false
  },
  function (msg) {
    let str = `Must be in voice chat with ${require('../../TuxedoMan.js').user.username}`
    return new Response(msg, str)
  }
)
