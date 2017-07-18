const music = require('../music.js')
const gameRoles = require('../gameRoles.js')
const main = require('../../TuxedoMan.js')
const db = require('../database.js')
const Response = require('../response.js')

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
        str = `Autoplay set to ${client.autoplay}!`
        break
      case 'np':
        client.informNowPlaying = !client.informNowPlaying
        str = `Now Playing announcements set to ${client.informNowPlaying}!`
        break
      case 'autonp':
        client.informAutoPlaying = !client.informAutoPlaying
        str = `Now Playing (autoplay) announcements set to ${client.informAutoPlaying}!`
        break
      case 'gameroles':
        client.gameRoles.active = !client.gameRoles.active
        gameRoles.sweepGames(client)
        str = `Game roles set to ${client.gameRoles.active}!`
        break
      case 'memes':
        client.meme = !client.meme
        str = `Meme posting set to ${client.meme}!`
        break
      default:
        str = 'Specify option to toggle!'
    }
    db.updateGuilds(client)
    return new Response(msg, str)
  }
}
