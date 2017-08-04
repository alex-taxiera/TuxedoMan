const music = require('../music.js')
const gameRoles = require('../gameRoles.js')
const db = require('../database.js')
const Command = require('../classes/Command.js')
const Response = require('../classes/Response.js')

module.exports = new Command(
  'toggle',
  'Toggle various settings',
  [`Alias: auto|np|autonp|gameroles|memes`],
  'VIP',
  false,
  function (msg, params) {
    let id = msg.guild.id
    let guildInfo = db.getGuildInfo(id)
    let gameRolesInfo = db.getGameRolesInfo(id)
    let playerInfo = db.getPlayerInfo(id)
    let str = ''

    switch (params[0]) {
      case 'auto':
        playerInfo.autoplay = !playerInfo.autoplay
        music.checkPlayer(id)
        str = `Autoplay set to ${playerInfo.autoplay}!`
        break
      case 'np':
        playerInfo.informNowPlaying = !playerInfo.informNowPlaying
        str = `Now Playing announcements set to ${playerInfo.informNowPlaying}!`
        break
      case 'autonp':
        playerInfo.informAutoPlaying = !playerInfo.informAutoPlaying
        str = `Now Playing (autoplay) announcements set to ${playerInfo.informAutoPlaying}!`
        break
      case 'gameroles':
        gameRolesInfo.active = !gameRolesInfo.active
        gameRoles.sweepGames(id)
        str = `Game roles set to ${gameRolesInfo.active}!`
        break
      case 'memes':
        guildInfo.meme = !guildInfo.meme
        str = `Meme posting set to ${guildInfo.meme}!`
        break
      default:
        str = 'Specify option to toggle!'
        return new Response(msg, str)
    }
    return new Response(msg, str)
  }
)
