const fs = require('fs')
const config = require('../config.json')

const guildData = config.data + config.guilds
var guilds = new Map()

module.exports = {
  updateGuilds: function (entry, multi = false) {
    if (multi) {
      entry.forEach((value, key) => {
        guilds.set(key, value)
      })
    } else {
      guilds.set(entry.guild.id, entry)
    }
    module.exports.writeFile()
  },
  removeGuild: function (id) {
    guilds.delete(id)
  },
  getGuildInfo: function (id) {
    return guilds.get(id)
  },
  writeFile: function () {
    var writeMap = new Map()
    guilds.forEach((value, key) => {
      let tmp = {
        guild: value.guild,
        text: value.text,
        voice: value.voice,
        vip: value.vip,
        autoplay: value.autoplay,
        informNowPlaying: value.informNowPlaying,
        informAutoPlaying: value.informAutoPlaying,
        meme: value.meme,
        volume: value.volume,
        gameRoles: value.gameRoles
      }
      writeMap.set(key, tmp)
    })
    fs.open(guildData, 'w+', () => {
      fs.writeFileSync(guildData, JSON.stringify([...writeMap], null, 2), 'utf-8')
    })
  }
}
