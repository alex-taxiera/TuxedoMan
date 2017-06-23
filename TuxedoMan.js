const Discordie = require('discordie')
const fs = require('fs')
const seedrandom = require('seedrandom')
const rng = seedrandom()

// global variables
global.g = [] //  g = guilds (list of guilds with all info)

var bot = new Discordie({autoReconnect: true})

// project modules
const mods = require('./modules/')

// connect bot
start()

// randomly select a game every 12 hours
setInterval(function () {
  let games = mods.config.games
  let game = games[Math.floor(rng() * games.length)]
  mods.func.log(`playing ${game}`)
  bot.User.setGame(game)
}, 43200000)

bot.Dispatcher.on('GUILD_MEMBER_UPDATE', e => {
  if (e.member.id === bot.User.id) {
    var client = mods.func.getClient(e.member.guild.id)
    if (client.textChannel && !mods.func.can(['SEND_MESSAGES'], bot.Channels
    .textForGuild(client.guild.id).find(ch => ch.id === client.textChannel.id))) {
      client.textChannel = mods.func.findChannel('text', client.guild.id)
      dmWarn(e.member.guild, client.textChannel, client.voiceChannel)
    } else if (client.voiceChannel && !mods.func.can(['SPEAK', 'CONNECT'], bot.Channels
    .voiceForGuild(client.guild.id).find(ch => ch.id === client.voiceChannel.id))) {
      client.voiceChannel = mods.func.findChannel('voice', client.guild.id)
      dmWarn(e.member.guild, client.textChannel, client.voiceChannel)
    } else if (!client.textChannel) {
      client.textChannel = mods.func.findChannel('text', client.guild.id)
    } else if (!client.voiceChannel) {
      client.voiceChannel = mods.func.findChannel('voice', client.guild.id)
    } else {
      return
    }
    mods.func.writeChanges()
  }
})

bot.Dispatcher.on('GUILD_ROLE_DELETE', e => {
  var client = mods.func.getClient(e.guild.id)
  if (e.roleId === client.vip) {
    client.vip = null
    return mods.func.writeChanges()
  } else if (client.gameRoles.roles.find(r => r === e.roleId)) {
    client.gameRoles.roles.splice(client.gameRoles.roles.findIndex(r => r === e.roleId), 1)
    mods.func.writeChanges()
  }
})

bot.Dispatcher.on('PRESENCE_UPDATE', e => {
  var client = mods.func.getClient(e.guild.id)
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
  var client = mods.func.getClient(e.guildId)
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
  var client = mods.func.getClient(e.guildId)
  if (client.isPlaying && client.encoder.voiceConnection &&
    client.encoder.voiceConnection.channel.members.length === 1 && !client.paused) {
    client.paused = true
    client.encoder.voiceConnection.getEncoderStream().cork()
  }
})

bot.Dispatcher.on('CHANNEL_CREATE', e => {
  var ch = e.channel
  var client = mods.func.getClient(ch.guild_id)
  if (!client.textChannel || !client.voiceChannel) {
    if (ch.type === 0 && !client.textChannel && mods.func.can(['SEND_MESSAGES'], ch)) {
      client.textChannel = {id: ch.id, name: ch.name}
    } else if (ch.type === 2 && !client.voiceChannel && mods.func.can(['SPEAK', 'CONNECT'], ch)) {
      ch.join()
      client.voiceChannel = {id: ch.id, name: ch.name}
    } else {
      return
    }
    mods.func.writeChanges()
  }
})

bot.Dispatcher.on('CHANNEL_DELETE', e => {
  var client = mods.func.getClient(e.data.guild_id)
  var guild = bot.Guilds.toArray().find(g => g.id === client.guild.id)
  if (e.channelId === client.textChannel.id) {
    client.textChannel = mods.func.findChannel('text', client.guild.id)
    dmWarn(guild, client.textChannel, client.voiceChannel)
  } else if (e.channelId === client.voiceChannel.id) {
    client.voiceChannel = mods.func.findChannel('voice', client.guild.id)
    dmWarn(guild, client.textChannel, client.voiceChannel)
  } else {
    return
  }
  mods.func.writeChanges()
})

bot.Dispatcher.on('CHANNEL_UPDATE', e => {
  var ch = e.channel
  var client = mods.func.getClient(ch.guild.id)
  if (client.textChannel && client.textChannel.id === ch.id && !mods.func.can(['SEND_MESSAGES'], ch)) {
    mods.func.log('in if')
    client.textChannel = mods.func.findChannel('text', client.guild.id)
    dmWarn(ch.guild, client.textChannel, client.voiceChannel)
  } else if (client.voiceChannel && client.voiceChannel.id === ch.id && !mods.func.can(['SPEAK', 'CONNECT'], ch)) {
    client.voiceChannel = mods.func.findChannel('voice', client.guild.id)
    dmWarn(ch.guild, client.textChannel, client.voiceChannel)
  } else if (!client.textChannel && ch.type === 0 && mods.func.can(['SEND_MESSAGES'], ch)) {
    client.textChannel = {id: ch.id, name: ch.name}
  } else if (!client.voiceChannel && ch.type === 2 && mods.func.can(['SPEAK', 'CONNECT'], ch)) {
    ch.join()
    client.voiceChannel = {id: ch.id, name: ch.name}
  } else {
    return
  }
  mods.func.writeChanges()
})

bot.Dispatcher.on('GUILD_CREATE', e => {
  var guilds = []
  guilds.push(e.guild)
  mods.func.log(`joined ${e.guild.name} guild`)
  sweepClients(guilds)
})

bot.Dispatcher.on('GUILD_DELETE', e => {
  var index = global.g.findIndex(s => s.guild.id === e.guildId)
  var client = mods.func.getClient(e.guildId)
  mods.func.log(`left ${client.guild.name} guild`)
  client.paused = true
  if (client.isPlaying) {
    client.encoder.destroy()
  }
  global.g.splice(index, 1)
  mods.func.writeChanges()
})

bot.Dispatcher.on('GATEWAY_READY', () => {
  const guildData = mods.config.data + mods.config.guilds
  global.g = []
  mods.func.log('online')
  bot.User.setGame('BZZT KILLING BZZT')
  fs.open(guildData, 'r', (err) => {
    var guilds = bot.Guilds.toArray()
    if (err) {
      mods.func.log('no guild file')
      sweepClients(guilds)
    } else {
      var tmp = null
      var oldGuilds
      try {
        oldGuilds = JSON.parse(fs.readFileSync(guildData, 'utf-8'))
      } catch (e) {
        mods.func.log('empty guild file', e.message)
        return sweepClients(guilds)
      }
      var i
      for (i = 0; i < oldGuilds.length; i++) {
        tmp = null
        var guild = guilds.find(s => s.id === oldGuilds[i].guild.id)
        if (guild) {
          tmp = {}
          tmp.guild = {id: guild.id, name: guild.name}
          var oldTextChannel = null
          if (oldGuilds[i].textChannel) {
            oldTextChannel = bot.Channels.textForGuild(tmp.guild.id)
                      .find(c => c.id === oldGuilds[i].textChannel.id)
          }
          if (oldTextChannel && mods.func.can(['SEND_MESSAGES'], oldTextChannel)) {
            tmp.textChannel = {id: oldTextChannel.id, name: oldTextChannel.name}
          } else {
            tmp.textChannel = mods.func.findChannel('text', tmp.guild.id)
          }

          var oldVoiceChannel = null
          if (oldGuilds[i].voiceChannel) {
            oldVoiceChannel = bot.Channels.voiceForGuild(tmp.guild.id)
                      .find(c => c.id === oldGuilds[i].voiceChannel.id)
          }
          if (oldVoiceChannel && mods.func.can(['SPEAK', 'CONNECT'], oldVoiceChannel)) {
            oldVoiceChannel.join()
            tmp.voiceChannel = {id: oldVoiceChannel.id, name: oldVoiceChannel.name}
          } else {
            tmp.voiceChannel = mods.func.findChannel('voice', tmp.guild.id)
          }
          if (!tmp.textChannel || !tmp.voiceChannel) {
            dmWarn(guilds[i], tmp.textChannel, tmp.voiceChannel)
          }
          global.g.push({
            guild: tmp.guild,
            textChannel: tmp.textChannel,
            voiceChannel: tmp.voiceChannel,
            vip: oldGuilds[i].vip,
            queue: [],
            nowPlaying: {},
            isPlaying: false,
            paused: false,
            autoplay: oldGuilds[i].autoplay,
            informNowPlaying: oldGuilds[i].informNowPlaying,
            informAutoPlaying: oldGuilds[i].informAutoPlaying,
            encoder: {},
            volume: oldGuilds[i].volume,
            meme: oldGuilds[i].meme,
            swamp: true,
            lmaoCount: 0,
            gameRoles: oldGuilds[i].gameRoles
          })
        }
      }
      var initGuilds = []
      for (i = 0; i < global.g.length; i++) {
        initGuilds.push(global.g[i].guild)
        var index = guilds.findIndex(guilds => guilds.id === global.g[i].guild.id)
        if (index !== -1) {
          guilds.splice(index, 1)
        }
      }
      setTimeout(function () { init(initGuilds) }, 2000)
      sweepClients(guilds)
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
    } else if (mods.func.getClient(msg.guild.id).meme) {
      if (mods.func.can(['SEND_MESSAGES'], msg.channel)) {
        mods.cmd.handleCommand(msg, text, true)
      }
    }
  }
})

function start () {
  const tok = mods.config.token
  if (tok !== '') {
    bot.connect({token: tok})
  } else {
    mods.func.log('no token')
  }
}

function sweepClients (guilds) {
  if (guilds.length !== 0) {
    for (var i = 0; i < guilds.length; i++) {
      var tmp = {}
      tmp.guild = {id: guilds[i].id, name: guilds[i].name}
      tmp.textChannel = mods.func.findChannel('text', tmp.guild.id)
      tmp.voiceChannel = mods.func.findChannel('voice', tmp.guild.id)
      if (!tmp.textChannel || !tmp.voiceChannel) {
        dmWarn(guilds[i], tmp.textChannel, tmp.voiceChannel)
      }
      global.g.push({
        guild: tmp.guild,
        textChannel: tmp.textChannel,
        voiceChannel: tmp.voiceChannel,
        vip: null,
        queue: [],
        nowPlaying: {},
        isPlaying: false,
        paused: false,
        autoplay: false,
        informNowPlaying: true,
        informAutoPlaying: true,
        encoder: {},
        volume: 5,
        meme: false,
        swamp: true,
        lmaoCount: 0,
        gameRoles: {active: false, roles: []}
      })
    }
    setTimeout(function () { init(guilds) }, 2000)
  }
}

function init (guilds) {
  for (var i = 0; i < global.g.length; i++) {
    mods.gameRoles.sweepGames(global.g[i])
    if (guilds.find(s => s.id === global.g[i].guild.id) && global.g[i].autoplay &&
    bot.User.getVoiceChannel(global.g[i].guild.id).members.length !== 1) {
      mods.music.autoQueue(global.g[i])
    }
  }
  mods.func.writeChanges()
}

function dmWarn (guild, text, voice) {
  var str = ''
  if (!text && !voice) {
    str = 'There are no text channels or voice channels that are suitable for me! ' +
        'I would like sending and reading permissions in a text channel and connect ' +
        'and speak permissions in a voice channel'
    guild.members.find(m => m.id === guild.owner_id).openDM()
        .then(dm => {
          dm.sendMessage(str)
        })
  } else if (!text) {
    str = 'There are no text channels that are suitable for me! ' +
        'I would like sending and reading permissions'
    guild.members.find(m => m.id === guild.owner_id).openDM()
        .then(dm => {
          dm.sendMessage(str)
        })
  } else if (!voice) {
    str = 'There are no voice channels that are suitable for me! ' +
        'I would like speaking and connecting permissions'
    guild.members.find(m => m.id === guild.owner_id).openDM()
        .then(dm => {
          dm.sendMessage(str)
        })
  }
}

exports.get = function () { return bot }
exports.config = function () { return mods.config }
