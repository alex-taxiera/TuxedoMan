const Discordie = require('discordie')
const fs = require('fs')
const seedrandom = require('seedrandom')

// project modules
const mods = require('./modules/')
const config = require('./config.json')

var bot = new Discordie({ autoReconnect: true })
exports.bot = function () { return bot }

// connect bot
start()

// randomly select a game every 12 hours
setInterval(function () { setGame() }, 43200000) // 43200000

// events
bot.Dispatcher.on('GUILD_MEMBER_UPDATE', e => {
  if (e.member.id === bot.User.id) {
    var client = mods.db.getGuildInfo(e.member.guild.id)
    if (client.text && !mods.func.can(['SEND_MESSAGES', 'READ_MESSAGES'], bot.Channels
    .textForGuild(client.guild.id).find(ch => ch.id === client.text.id))) {
      client.text = mods.func.findChannel('text', client.guild.id)
      dmWarn(e.member.guild, client.text, client.voice)
    } else if (client.voice && !mods.func.can(['SPEAK', 'CONNECT'], bot.Channels
    .voiceForGuild(client.guild.id).find(ch => ch.id === client.voice.id))) {
      client.voice = mods.func.findChannel('voice', client.guild.id)
      dmWarn(e.member.guild, client.text, client.voice)
    } else if (!client.text) {
      client.text = mods.func.findChannel('text', client.guild.id)
    } else if (!client.voice) {
      client.voice = mods.func.findChannel('voice', client.guild.id)
    } else {
      return
    }
    mods.db.updateGuilds(client)
  }
})

bot.Dispatcher.on('GUILD_ROLE_DELETE', e => {
  var client = mods.db.getGuildInfo(e.guild.id)
  if (e.roleId === client.vip) {
    client.vip = null
    return mods.db.updateGuilds(client)
  } else if (client.gameRoles.roles.find(r => r === e.roleId)) {
    client.gameRoles.roles.splice(client.gameRoles.roles.findIndex(r => r === e.roleId), 1)
    mods.db.updateGuilds(client)
  }
})

bot.Dispatcher.on('PRESENCE_UPDATE', e => {
  var client = mods.db.getGuildInfo(e.guild.id)
  if (e.member.guild_id && client.gameRoles.active) {
    var user = e.member
    var role = e.guild.roles.find(r => r.name === user.previousGameName)
    if (role && client.gameRoles.roles.find(r => r === role.id) && user.hasRole(role)) {
      mods.gameRoles.unassignRole(user, role)
    }
    role = e.guild.roles.find(r => r.name === user.gameName)
    if (role && client.gameRoles.roles.find(r => r === role.id) && !user.hasRole(role)) {
      mods.gameRoles.assignRole(user, role)
    }
  }
})

bot.Dispatcher.on('DISCONNECTED', e => {
  mods.func.log('disconnected', `${e.error}\nRECONNECT DELAY: ${e.delay}`)
})

bot.Dispatcher.on('VOICE_CHANNEL_LEAVE', e => {
  var client = mods.db.getGuildInfo(e.guildId)
  if (e.user.id === bot.User.id) {
    mods.func.log(`left channel ${e.channel.name}`)
    if (!e.newChannelId) {
      var voiceChannel = bot.Channels.find(c => c.id === e.channelId)
      voiceChannel.join(voiceChannel).catch((e) => { mods.func.log(null, e) })
    }
  } else if (client.isPlaying && client.encoder.voiceConnection &&
    client.encoder.voiceConnection.channel.members.length === 1 && !client.paused) {
    client.paused = true
    client.encoder.voiceConnection.getEncoderStream().cork()
  }
})

bot.Dispatcher.on('VOICE_CHANNEL_JOIN', e => {
  var client = mods.db.getGuildInfo(e.guildId)
  if (client.isPlaying && client.encoder.voiceConnection &&
    client.encoder.voiceConnection.channel.members.length === 1 && !client.paused) {
    client.paused = true
    client.encoder.voiceConnection.getEncoderStream().cork()
  }
})

bot.Dispatcher.on('CHANNEL_CREATE', e => {
  var ch = e.channel
  var client = mods.db.getGuildInfo(ch.guild_id)
  if (client && (!client.text || !client.voice)) {
    if (ch.type === 0 && !client.text && mods.func.can(['SEND_MESSAGES', 'READ_MESSAGES'], ch)) {
      client.text = {id: ch.id, name: ch.name}
    } else if (ch.type === 2 && !client.voice && mods.func.can(['SPEAK', 'CONNECT'], ch)) {
      ch.join()
      client.voice = {id: ch.id, name: ch.name}
    } else {
      return
    }
    mods.db.updateGuilds(client)
  }
})

bot.Dispatcher.on('CHANNEL_DELETE', e => {
  var client = mods.db.getGuildInfo(e.data.guild_id)
  var guild = bot.Guilds.toArray().find(g => g.id === client.guild.id)
  if (e.channelId === client.text.id) {
    client.text = mods.func.findChannel('text', client.guild.id)
    dmWarn(guild, client.text, client.voice)
  } else if (e.channelId === client.voice.id) {
    client.voice = mods.func.findChannel('voice', client.guild.id)
    dmWarn(guild, client.text, client.voice)
  } else {
    return
  }
  mods.db.updateGuilds(client)
})

bot.Dispatcher.on('CHANNEL_UPDATE', e => {
  var ch = e.channel
  var client = mods.db.getGuildInfo(ch.guild.id)
  if (client.text && client.text.id === ch.id && !mods.func
  .can(['SEND_MESSAGES', 'READ_MESSAGES'], ch)) {
    mods.func.log('in if')
    client.text = mods.func.findChannel('text', client.guild.id)
    dmWarn(ch.guild, client.text, client.voice)
  } else if (client.voice && client.voice.id === ch.id && !mods.func
  .can(['SPEAK', 'CONNECT'], ch)) {
    client.voice = mods.func.findChannel('voice', client.guild.id)
    dmWarn(ch.guild, client.text, client.voice)
  } else if (!client.text && ch.type === 0 && mods.func
  .can(['SEND_MESSAGES', 'READ_MESSAGES'], ch)) {
    client.text = {id: ch.id, name: ch.name}
  } else if (!client.voice && ch.type === 2 && mods.func
  .can(['SPEAK', 'CONNECT'], ch)) {
    ch.join()
    client.voice = {id: ch.id, name: ch.name}
  } else {
    return
  }
  mods.db.updateGuilds(client)
})

bot.Dispatcher.on('GUILD_CREATE', e => {
  mods.func.log(`joined ${e.guild.name} guild`)
  sweepClients([e.guild])
})

bot.Dispatcher.on('GUILD_DELETE', e => {
  var client = mods.db.getGuildInfo(e.guildId)
  mods.func.log(`left ${client.guild.name} guild`)
  client.paused = true
  if (client.isPlaying) {
    client.encoder.destroy()
  }
  mods.db.removeGuild(e.guildId)
})

bot.Dispatcher.on('GATEWAY_READY', () => {
  const guildData = config.data + config.guilds
  let oldGuilds = new Map()
  mods.func.log('online')
  setGame()
  fs.open(guildData, 'r', (err) => {
    let allGuilds = bot.Guilds
    if (err) {
      mods.func.log('no guild file')
      sweepClients(allGuilds)
    } else {
      let savedGuilds
      try {
        savedGuilds = new Map(JSON.parse(fs.readFileSync(guildData, 'utf-8')))
      } catch (e) {
        mods.func.log('empty guild file', e.message)
        return sweepClients(allGuilds)
      }
      savedGuilds.forEach((savedGuild, savedId, map) => {
        let tmp = {}
        let guild = allGuilds.get(savedId)
        if (guild) {
          tmp.guild = { id: guild.id, name: guild.name }
          if (savedGuild.text) {
            let text = bot.Channels.get(savedGuild.text.id)
            if (text && mods.func.can(['SEND_MESSAGES', 'READ_MESSAGES'], text)) {
              tmp.text = { id: text.id, name: text.name }
            } else {
              tmp.text = mods.func.findChannel('text', guild.id)
            }
          } else {
            tmp.text = null
          }
          if (savedGuild.voice) {
            let voice = bot.Channels.get(savedGuild.voice.id)
            if (voice && mods.func.can(['SPEAK', 'CONNECT'], voice)) {
              voice.join()
              tmp.voice = { id: voice.id, name: voice.name }
            } else {
              tmp.voice = mods.func.findChannel('voice', guild.id)
            }
          } else {
            tmp.voice = null
          }
          if (!tmp.text || !tmp.voice) {
            dmWarn(guild, tmp.text, tmp.voice)
          }
          tmp.vip = savedGuild.vip
          tmp.queue = []
          tmp.nowPlaying = {}
          tmp.isPlaying = false
          tmp.paused = false
          tmp.autoplay = savedGuild.autoplay
          tmp.informNowPlaying = savedGuild.informNowPlaying
          tmp.informAutoPlaying = savedGuild.informAutoPlaying
          tmp.encoder = {}
          tmp.volume = savedGuild.volume
          tmp.meme = savedGuild.meme
          tmp.swamp = true
          tmp.lmaoCount = 0
          tmp.gameRoles = savedGuild.gameRoles

          oldGuilds.set(tmp.guild.id, tmp)
        }
      })
      init(oldGuilds)
      sweepClients(allGuilds.filter((guild) => { if (!oldGuilds.get(guild.id)) { return guild } }))
    }
  })
})

bot.Dispatcher.on('MESSAGE_CREATE', e => {
  var msg = e.message
  var text = msg.content
  if (msg.member && msg.member.id !== bot.User.id) {
    if (text[0] === '*') {
      if (mods.cmd.handleCommand(msg, text.substring(1), false)) {
        if (mods.func.can(['MANAGE_MESSAGES'], msg.channel)) {
          setTimeout(function () { msg.delete() }, 5000)
        }
      }
    } else if (mods.db.getGuildInfo(msg.guild.id).meme) {
      if (mods.func.can(['SEND_MESSAGES'], msg.channel)) {
        mods.cmd.handleCommand(msg, text, true)
      }
    }
  }
})

// helpers
function start () {
  if (!fs.existsSync(config.data)) {
    mods.func.log('creating data folder')
    fs.mkdirSync(config.data)
  }
  if (!fs.existsSync(config.playlists)) {
    mods.func.log('creating playlists folder')
    fs.mkdirSync(config.playlists)
  }
  const tok = config.token
  if (tok !== '') {
    bot.connect({token: tok})
  } else {
    mods.func.log('no token')
  }
}

function sweepClients (guilds) {
  if (guilds.length !== 0) {
    var map = new Map()

    guilds.forEach((guild) => {
      let tmp = {}
      tmp.guild = {id: guild.id, name: guild.name}
      tmp.text = mods.func.findChannel('text', guild.id)
      tmp.voice = mods.func.findChannel('voice', guild.id)
      if (tmp.voice) {
        bot.Channels.get(tmp.voice.id).join()
      }
      if (!tmp.text || !tmp.voice) {
        dmWarn(guild, tmp.text, tmp.voice)
      }
      tmp.vip = null
      tmp.queue = []
      tmp.nowPlaying = {}
      tmp.isPlaying = false
      tmp.paused = false
      tmp.autoplay = false
      tmp.informNowPlaying = true
      tmp.informAutoPlaying = true
      tmp.encoder = {}
      tmp.volume = 5
      tmp.meme = false
      tmp.swamp = true
      tmp.lmaoCount = 0
      tmp.gameRoles = {active: false, roles: []}

      map.set(tmp.guild.id, tmp)
    })
    init(map)
  }
}

function init (guilds) {
  mods.db.updateGuilds(guilds, true)
  guilds.forEach((guild) => {
    mods.gameRoles.sweepGames(guild)
    setTimeout(() => {
      let voice = bot.User.getVoiceChannel(guild.guild.id)
      if (voice && guild.autoplay && voice.members.length !== 1) {
        mods.music.autoQueue(guild)
      }
    }, 500)
  })
}

function dmWarn (guild, text, voice) {
  let owner = guild.members.find(m => m.id === guild.owner_id)
  let str = ''
  if (!text && !voice) {
    str = 'There are no text channels or voice channels that are suitable for me! ' +
    'I would like sending and reading permissions in a text channel and connect ' +
    'and speak permissions in a voice channel'
    owner.openDM()
    .then(dm => {
      dm.sendMessage(str)
    })
  } else if (!text) {
    str = 'There are no text channels that are suitable for me! ' +
    'I would like sending and reading permissions'
    owner.openDM()
    .then(dm => {
      dm.sendMessage(str)
    })
  } else if (!voice) {
    str = 'There are no voice channels that are suitable for me! ' +
    'I would like speaking and connecting permissions'
    owner.openDM()
    .then(dm => {
      dm.sendMessage(str)
    })
  }
}

function setGame () {
  let rng = seedrandom()
  let games = config.games
  let game = bot.User.gameName
  while (game === bot.User.gameName) {
    game = games[Math.floor(rng() * games.length)]
  }
  mods.func.log(`playing ${game}`)
  bot.User.setGame(game)
}
