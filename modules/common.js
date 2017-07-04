const moment = require('moment')
const main = require('../TuxedoMan.js')

module.exports = {
  log: function (str, err) {
    if (typeof str !== 'string') {
      str = str.toString()
    }
    console.log(`${moment().format('MM/DD HH:mm:ss')} | BZZT ${str.toUpperCase()} BZZT`)
    if (err) {
      console.log(err)
    }
  },
  findChannel: function (type, guildId) {
    const bot = main.bot()
    if (type === 'text') {
      let channels = bot.Channels.textForGuild(guildId)
      .filter((channel) => {
        if (module.exports.can(['SEND_MESSAGES', 'READ_MESSAGES'], channel)) { return channel }
      })
      if (channels[0]) {
        return {id: channels[0].id, name: channels[0].name}
      }
      // for (let i = 0; i < textChannels.length; i++) {
      //   if (module.exports.can(['SEND_MESSAGES'], textChannels[i])) {
      //     return {id: textChannels[i].id, name: textChannels[i].name}
      //   }
      // }
    } else if (type === 'voice') {
      let channels = bot.Channels.voiceForGuild(guildId)
      .filter((channel) => {
        if (module.exports.can(['SPEAK', 'CONNECT'], channel)) { return channel }
      })
      if (channels[0]) {
        channels[0].join()
        return {id: channels[0].id, name: channels[0].name}
      }
      // for (let i = 0; i < voiceChannels.length; i++) {
      //   if (module.exports.can(['SPEAK', 'CONNECT'], voiceChannels[i])) {
      //     voiceChannels[i].join()
      //     return {id: voiceChannels[i].id, name: voiceChannels[i].name}
      //   }
      // }
    }
    return null
  },
  getTextChannel: function (client) {
    let text = main.bot().Channels.get(client.text.id)
    if (!text || !module.exports.can(['SEND_MESSAGES', 'READ_MESSAGES'], text)) {
      return module.exports.findChannel('text', client.guild.id)
    } else {
      return text
    }
  },
  messageHandler: function (message, client) {
    if (message) {
      let delay
      if (!message.delay && message.delay !== 0) {
        delay = 10000
      } else {
        delay = message.delay
      }
      message.promise
      .then((m) => {
        if (delay) {
          setTimeout(function () { m.delete() }, delay)
        }
      })
      .catch(() => {
        let textChannel = module.exports.getTextChannel(client)
        if (textChannel) {
          if (message.embed) {
            textChannel.sendMessage(message.content, false, message.embed)
                  .then((m) => {
                    if (delay) {
                      setTimeout(function () { m.delete() }, delay)
                    }
                  })
          } else {
            textChannel.sendMessage(message.content)
            .then((m) => {
              if (delay) {
                setTimeout(function () { m.delete() }, delay)
              }
            })
          }
        }
      })
    }
  },
  can: function (permissions, context) {
    for (let i = 0; i < permissions.length; i++) {
      if (!context) {
        return false
      }
      let perm = main.bot().User.permissionsFor(context)
      if (context.isGuildText) {
        let text = perm.Text
        for (let p in text) {
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
        let voice = perm.Voice
        for (let p in voice) {
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
  }
}
