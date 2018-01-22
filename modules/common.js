const moment = require('moment')
const colors = require('colors')

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
    let botChannels = require('../TuxedoMan.js').guilds.get(guildId).channels
    if (type === 'text') {
      let channels = botChannels.filter((ch) => { return ch.type === 0 })
      .filter((channel) => {
        return module.exports.can(['sendMessages', 'readMessages'], channel)
      })
      if (channels[0]) {
        return { id: channels[0].id, name: channels[0].name }
      }
    } else if (type === 'voice') {
      let channels = botChannels.filter((ch) => { return ch.type === 2 })
      .filter((channel) => {
        return module.exports.can(['voiceSpeak', 'voiceConnect'], channel)
      })

      if (channels[0]) {
        channels[0].join()
        .then(() => { require('./music.js').checkPlayer(channels[0].guild) })
        return { id: channels[0].id, name: channels[0].name }
      }
    }
    return null
  },
  getTextChannel: function (id) {
    let text = require('../TuxedoMan.js')
              .getChannel(require('./database').getGuildInfo(id).text.id)
    if (!module.exports.can(['sendMessages', 'readMessages'], text)) {
      return module.exports.findChannel('text', id)
    } else {
      return text
    }
  },
  messageHandler: function (res) {
    if (res && res.message) {
      /*
      if (typeof res.message === 'string') {
        let id = res.message
        let textChannel = module.exports.getTextChannel(id)
        if (textChannel) {
          textChannel.createMessage(res.content)
          .then((m) => {
            setTimeout(m.delete, res.delay)
          })
        }
      } else {
      */
      let id = res.message.channel.guild.id
      let content
      if (res.content.embed) {
        let embed = res.content.embed
        let string = res.message.author.mention + res.content.string
        content = { string, embed }
      } else {
        content = `${res.message.author.mention}, ${res.content}`
      }
      res.message.channel.createMessage(content)
      .then((m) => {
        setTimeout(() => { m.delete() }, res.delay)
      })
      .catch(() => {
        let textChannel = module.exports.getTextChannel(id)
        if (textChannel) {
          textChannel.createMessage(content)
          .then((m) => {
            setTimeout(() => { m.delete() }, res.delay)
          })
        }
      })
      // }
    }
  },
  can: function (needs, context) {
    if (!context) {
      return false
    }

    return needs.every((need) => {
      return context.permissionsOf(require('../TuxedoMan.js').user.id).has(need)
    })
  },
  dmWarn: function (guild, text, voice) {
    let owner = guild.members.get(guild.ownerID)
    let str = ''

    if (!text && !voice) {
      str = 'There are no text channels or voice channels that are suitable for me! ' +
      'I would like sending and reading permissions in a text channel and voiceConnect ' +
      'and voiceSpeak permissions in a voice channel'
    } else if (!text) {
      str = 'There are no text channels that are suitable for me! ' +
      'I would like sending and reading permissions'
    } else if (!voice) {
      str = 'There are no voice channels that are suitable for me! ' +
      'I would like speaking and connecting permissions'
    }
    owner.user.getDMChannel()
    .then(dm => {
      dm.createMessage(str)
      .catch((e) => {
        module.exports.log('cannot send dm', e)
      })
    })
    .catch((e) => {
      module.exports.log('cannot open dm', e)
    })
  }
}
