const fs = require('fs')
const moment = require('moment')

module.exports = {
  log: function (str, err) {
    console.log(`${moment().format('MM/DD HH:mm:ss')} | BZZT ${str.toUpperCase()} BZZT`)
    if (err) {
      console.log(err)
    }
  },
  findChannel: function (type, guildId) {
    var i
    if (type === 'text') {
      var textChannels = global.bot.Channels.textForGuild(guildId)
      for (i = 0; i < textChannels.length; i++) {
        if (module.exports.can(['SEND_MESSAGES'], textChannels[i])) {
          return {id: textChannels[i].id, name: textChannels[i].name}
        }
      }
    } else if (type === 'voice') {
      var voiceChannels = global.bot.Channels.voiceForGuild(guildId)
      for (i = 0; i < voiceChannels.length; i++) {
        if (module.exports.can(['SPEAK', 'CONNECT'], voiceChannels[i])) {
          voiceChannels[i].join()
          return {id: voiceChannels[i].id, name: voiceChannels[i].name}
        }
      }
    }
    return null
  },
  getTextChannel: function (client) {
    var text = global.bot.Channels.textForGuild(client.guild.id)
    .find(c => c.id === client.textChannel.id)
    if (!text || !module.exports.can(['SEND_MESSAGES'], text)) {
      return module.exports.findChannel('text', client.guild.id)
    } else {
      return text
    }
  },
  messageHandler: function (message, client) {
    if (message) {
      var delay
      if (!message.delay) {
        delay = 10000
      } else {
        delay = message.delay
      }
      message.promise.then((m) => {
        setTimeout(function () { m.delete() }, delay)
      })
            .catch(() => {
              var textChannel = module.exports.getTextChannel(client)
              if (textChannel) {
                if (message.embed) {
                  textChannel.sendMessage(message.content, false, message.embed)
                        .then((m) => {
                          setTimeout(function () { m.delete() }, delay)
                        })
                } else {
                  textChannel.sendMessage(message.content)
                        .then((m) => {
                          setTimeout(function () { m.delete() }, delay)
                        })
                }
              }
            })
    }
  },
  getClient: function (guildId) {
    return global.g.find(c => c.guild.id === guildId)
  },
  can: function (permissions, context) {
    for (var i = 0; i < permissions.length; i++) {
      if (!context) {
        return false
      }
      var perm = global.bot.User.permissionsFor(context)
      var p
      if (context.isGuildText) {
        var text = perm.Text
        for (p in text) {
          if (!text.hasOwnProperty(p)) {
            continue
          }
          if (p === permissions[i]) {
            if (!text[p]) {
              return false
            }
          }
        }
      } else if (context.isGuildVoice) {
        var voice = perm.Voice
        for (p in voice) {
          if (!voice.hasOwnProperty(p)) {
            continue
          }
          if (p === permissions[i]) {
            if (!voice[p]) {
              return false
            }
          }
        }
      } else {
        return false
      }
    }
    return true
  },
  writeChanges: function () {
    var tmp = []
    for (var i = 0; i < global.g.length; i++) {
      tmp.push({
        guild: global.g[i].guild,
        textChannel: global.g[i].textChannel,
        voiceChannel: global.g[i].voiceChannel,
        vip: global.g[i].vip,
        autoplay: global.g[i].autoplay,
        informNowPlaying: global.g[i].informNowPlaying,
        informAutoPlaying: global.g[i].informAutoPlaying,
        meme: global.g[i].meme,
        volume: global.g[i].volume,
        gameRoles: global.g[i].gameRoles
      })
    }
    fs.open(global.guildData, 'w+', () => {
      fs.writeFileSync(global.guildData, JSON.stringify(tmp, null, 2), 'utf-8')
    })
    module.exports.log('wrote to file')
  }
}
