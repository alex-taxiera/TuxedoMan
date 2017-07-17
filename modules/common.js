const moment = require('moment')
const colors = require('colors')
const main = require('../TuxedoMan.js')

module.exports = {
  log: function (str, color, err) {
    if (typeof str !== 'string') {
      str = str.toString()
    }

    console.log(colors.gray(`${moment().format('MM/DD HH:mm:ss')}`) + ' | ' +
    colors[color](`BZZT ${str.toUpperCase()} BZZT`))
    if (err) {
      console.log(colors.red(err))
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
        return { id: channels[0].id, name: channels[0].name }
      }
    } else if (type === 'voice') {
      let channels = bot.Channels.voiceForGuild(guildId)
      .filter((channel) => {
        if (module.exports.can(['SPEAK', 'CONNECT'], channel)) { return channel }
      })

      if (channels[0]) {
        channels[0].join()
        return { id: channels[0].id, name: channels[0].name }
      }
    }
    return null
  },
  getTextChannel: function (client) {
    let text = main.bot().Channels.get(client.text.id)
    if (!module.exports.can(['SEND_MESSAGES', 'READ_MESSAGES'], text)) {
      return module.exports.findChannel('text', client.guild.id)
    } else {
      return text
    }
  },
  messageHandler: function (response, client) {
    if (!response.message) { return }

    if (!response.embed) {
      response.message.reply(response.content)
      .then((m) => {
        setTimeout(() => { m.delete() }, response.delay)
      })
      .catch(() => {
        let textChannel = module.exports.getTextChannel(client)
        if (textChannel) {
          textChannel.sendMessage(response.content)
          .then((m) => {
            setTimeout(() => { m.delete() }, response.delay)
          })
        }
      })
    } else {
      response.message.channel.sendMessage(response.content, false, response.embed)
      .then((m) => {
        setTimeout(() => { m.delete() }, response.delay)
      })
      .catch(() => {
        let textChannel = module.exports.getTextChannel(client)
        if (textChannel) {
          textChannel.sendMessage(response.content, false, response.embed)
          .then((m) => {
            setTimeout(() => { m.delete() }, response.delay)
          })
        }
      })
    }
  },
  can: function (needs, context) {
    if (!context) {
      return false
    }

    return needs.every((need) => {
      let permission = main.bot().User.permissionsFor(context)
      if (context.isGuildText) {
        return permission.Text[need]
      } else if (context.isGuildVoice) {
        return permission.Voice[need]
      }
    })
  }
}
