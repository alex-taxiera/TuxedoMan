const func = require('../common.js')
module.exports = {
  command: 'prefs',
  description: 'Display current bot preferences',
  parameters: [],
  rank: 2,
  execute: function (msg) {
    var client = func.getClient(msg.guild.id)
    var guild = global.bot.Guilds.toArray().find(g => g.id === client.guild.id)
    var vipRole = func.getCleanVipRole(client, guild)
    var gameRoles = func.getCleanGameRoles(client, guild)

    var str = 'Preferences'
    var embed =
      {
        color: 0x3498db,
        fields: [{name: 'Default Text Channel', value: client.textChannel.name},
            {name: 'Default Voice Channel', value: client.voiceChannel.name},
            {name: 'VIP Role', value: vipRole},
            {name: 'Autoplay', value: client.autoplay},
            {name: 'Announce Now Playing', value: client.informNowPlaying},
            {name: 'Announce Now Playing from Autoplay', value: client.informAutoPlaying},
            {name: 'Memes', value: client.meme},
            {name: 'Music Volume', value: `${client.volume * 2}`},
            {name: 'Game Roles', value: gameRoles}]
      }
    return {promise: msg.reply(str, false, embed), content: str, delay: 25000, embed: embed}
  }
}
