const music = require('../music.js')
const gameRoles = require('../gameRoles.js')
const main = require('../../TuxedoMan.js')
const db = require('../database.js')

module.exports = {
  command: 'toggle',
  description: 'Toggle various settings',
  parameters: [`Alias: auto|np|autonp|gameroles|memes`],
  rank: 2,
  execute: function (msg, params) {
    let client = db.getGuildInfo(msg.guild.id)
    let str = ''
    switch (params[0]) {
      case 'auto':
        client.autoplay = !client.autoplay
        if (!client.isPlaying && client.autoplay && main.bot().User.getVoiceChannel(msg.guild).members.length !== 1) {
          client.paused = false
          music.autoQueue(client)
        }
        db.updateGuilds(client)
        str = `Autoplay set to ${client.autoplay}!`
        return {promise: msg.reply(str), content: str}
      case 'np':
        client.informNowPlaying = !client.informNowPlaying
        db.updateGuilds(client)
        str = `Now Playing announcements set to ${client.informNowPlaying}!`
        return {promise: msg.reply(str), content: str}
      case 'autonp':
        client.informAutoPlaying = !client.informAutoPlaying
        db.updateGuilds(client)
        str = `Now Playing (autoplay) announcements set to ${client.informAutoPlaying}!`
        return {promise: msg.reply(str), content: str}
      case 'gameroles':
        client.gameRoles.active = !client.gameRoles.active
        str = `Game roles set to ${client.gameRoles.active}!`
        gameRoles.sweepGames(client)
        db.updateGuilds(client)
        return {promise: msg.reply(str), content: str}
      case 'memes':
        client.meme = !client.meme
        db.updateGuilds(client)
        str = `Meme posting set to ${client.meme}!`
        return {promise: msg.reply(str), content: str}
      default:
        str = 'Specify option to toggle!'
        return {promise: msg.reply(str), content: str}
    }
  }
}
