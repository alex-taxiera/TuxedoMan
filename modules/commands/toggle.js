const func = require('../common.js')
const music = require('../music.js')
const gameRoles = require('../gameRoles.js')
const main = require('../../TuxedoMan.js')

module.exports = {
  command: 'toggle',
  description: 'Toggle various settings',
  parameters: [`Alias: auto|np|autonp|gameroles|memes`],
  rank: 2,
  execute: function (msg, params) {
    var client = func.getClient(msg.guild.id)
    var str = ''
    switch (params[0]) {
      case 'auto':
        client.autoplay = !client.autoplay
        if (!client.isPlaying && client.autoplay && main.bot().User.getVoiceChannel(msg.guild).members.length !== 1) {
          client.paused = false
          music.autoQueue(client)
        }
        func.writeChanges()
        str = `Autoplay set to ${client.autoplay}!`
        return {promise: msg.reply(str), content: str}
      case 'np':
        client.informNowPlaying = !client.informNowPlaying
        func.writeChanges()
        str = `Now Playing announcements set to ${client.informNowPlaying}!`
        return {promise: msg.reply(str), content: str}
      case 'autonp':
        client.informAutoPlaying = !client.informAutoPlaying
        func.writeChanges()
        str = `Now Playing (autoplay) announcements set to ${client.informAutoPlaying}!`
        return {promise: msg.reply(str), content: str}
      case 'gameroles':
        client.gameRoles.active = !client.gameRoles.active
        str = `Game roles set to ${client.gameRoles.active}!`
        gameRoles.sweepGames(client)
        func.writeChanges()
        return {promise: msg.reply(str), content: str}
      case 'memes':
        client.meme = !client.meme
        func.writeChanges()
        str = `Meme posting set to ${client.meme}!`
        return {promise: msg.reply(str), content: str}
      default:
        str = 'Specify option to toggle!'
        return {promise: msg.reply(str), content: str}
    }
  }
}
