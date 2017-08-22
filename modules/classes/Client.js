const watch = require('melanke-watchjs').watch

module.exports = class Client {
  constructor (guild, text, voice, vip, meme, playerInfo, gameRolesInfo) {
    // load to clients
    this.guildInfo = {
      guild: guild,
      text: text,
      voice: voice,
      vip: vip
    }
    if (playerInfo) {
      this.guildInfo.meme = meme
      this.playerInfo = playerInfo
      this.gameRolesInfo = gameRolesInfo
    } else {
      this.guildInfo.vip = null
      this.guildInfo.meme = false
      this.playerInfo = {
        autoplay: false,
        informNowPlaying: true,
        informAutoPlaying: true,
        volume: 5
      }
      this.gameRolesInfo = {
        active: false,
        roles: [],
        other: {
          active: false,
          role: ''
        }
      }
    }
    watch(this, () => {
      require('../database.js').updateClient(this.guildInfo.guild.id)
    })
  }
}
