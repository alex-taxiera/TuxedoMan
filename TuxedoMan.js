const Discordie = require('discordie')
const fs = require('fs')
const token = './token.txt'

// global variables
global.guildData = './data/guilds.json'
global.playlist = './playlist'
global.master = '162674484828962816'
global.g = [] //  g = guilds (list of guilds with all info)
var bot = new Discordie({autoReconnect: true})

// project modules
const cmd = require('./commands.js')
const music = require('./music.js')
const gameRoles = require('./gameRoles.js')
const func = require('./common.js')

// connect bot
start()

bot.Dispatcher.on('GUILD_MEMBER_UPDATE', e => {
  if (e.member.id === bot.User.id) {
    var client = func.getClient(e.member.guild.id)
    if (client.textChannel && !func.can(['SEND_MESSAGES'], bot.Channels
    .textForGuild(client.guild.id).find(ch => ch.id === client.textChannel.id))) {
      client.textChannel = func.findChannel('text', client.guild.id)
      dmWarn(e.member.guild, client.textChannel, client.voiceChannel)
    } else if (client.voiceChannel && !func.can(['SPEAK', 'CONNECT'], bot.Channels
    .voiceForGuild(client.guild.id).find(ch => ch.id === client.voiceChannel.id))) {
      client.voiceChannel = func.findChannel('voice', client.guild.id)
      dmWarn(e.member.guild, client.textChannel, client.voiceChannel)
    } else if (!client.textChannel) {
      client.textChannel = func.findChannel('text', client.guild.id)
    } else if (!client.voiceChannel) {
      client.voiceChannel = func.findChannel('voice', client.guild.id)
    } else {
      return
    }
    func.writeChanges()
  }
})

bot.Dispatcher.on('GUILD_ROLE_DELETE', e => {
  var client = func.getClient(e.guild.id)
  if (e.roleId === client.vip) {
    client.vip = null
    return func.writeChanges()
  } else if (client.gameRoles.roles.find(r => r === e.roleId)) {
    client.gameRoles.roles.splice(client.gameRoles.roles.findIndex(r => r === e.roleId), 1)
    func.writeChanges()
  }
})

bot.Dispatcher.on('PRESENCE_UPDATE', e => {
  var client = func.getClient(e.guild.id)
  if (e.member.guild_id && client.gameRoles.active) {
    var user = e.member
    var role = e.guild.roles.find(r => r.name === user.previousGameName)
    if (role && client.gameRoles.roles.find(r => r === role.id) && user.hasRole(role)) {
      gameRoles.unassignRole(user, role)
    }
    role = e.guild.roles.find(r => r.name === user.gameName)
    if (role && client.gameRoles.roles.find(r => r === role.id) && !user.hasRole(role)) {
      gameRoles.assignRole(user, role)
    }
  }
})

bot.Dispatcher.on('DISCONNECTED', e => {
  func.log(null, `${e.error}\nRECONNECT DELAY: ${e.delay}`)
})

bot.Dispatcher.on('VOICE_CHANNEL_LEAVE', e => {
  var client = func.getClient(e.guildId)
  if (e.user.id === bot.User.id) {
    func.log(`left channel ${e.channel.name}`)
    if (!e.newChannelId) {
      var voiceChannel = bot.Channels.find(c => c.id === e.channelId)
      voiceChannel.join(voiceChannel).catch((e) => { func.log(null, e) })
    }
  } else if (client.isPlaying && client.encoder.voiceConnection &&
    client.encoder.voiceConnection.channel.members.length === 1 && !client.paused) {
    client.paused = true
    client.encoder.voiceConnection.getEncoderStream().cork()
  }
})

bot.Dispatcher.on('VOICE_CHANNEL_JOIN', e => {
  var client = func.getClient(e.guildId)
  if (client.isPlaying && client.encoder.voiceConnection &&
    client.encoder.voiceConnection.channel.members.length === 1 && !client.paused) {
    client.paused = true
    client.encoder.voiceConnection.getEncoderStream().cork()
  }
})

bot.Dispatcher.on('CHANNEL_CREATE', e => {
  var ch = e.channel
  var client = func.getClient(ch.guild_id)
  if (!client.textChannel || !client.voiceChannel) {
    if (ch.type === 0 && !client.textChannel && func.can(['SEND_MESSAGES'], ch)) {
      client.textChannel = {id: ch.id, name: ch.name}
    } else if (ch.type === 2 && !client.voiceChannel && func.can(['SPEAK', 'CONNECT'], ch)) {
      ch.join()
      client.voiceChannel = {id: ch.id, name: ch.name}
    } else {
      return
    }
    func.writeChanges()
  }
})

bot.Dispatcher.on('CHANNEL_DELETE', e => {
  var client = func.getClient(e.data.guild_id)
  var guild = bot.Guilds.toArray().find(g => g.id === client.guild.id)
  if (e.channelId === client.textChannel.id) {
    client.textChannel = func.findChannel('text', client.guild.id)
    dmWarn(guild, client.textChannel, client.voiceChannel)
  } else if (e.channelId === client.voiceChannel.id) {
    client.voiceChannel = func.findChannel('voice', client.guild.id)
    dmWarn(guild, client.textChannel, client.voiceChannel)
  } else {
    return
  }
  func.writeChanges()
})

bot.Dispatcher.on('CHANNEL_UPDATE', e => {
  var ch = e.channel
  var client = func.getClient(ch.guild.id)
  if (client.textChannel && client.textChannel.id === ch.id && !func.can(['SEND_MESSAGES'], ch)) {
    func.log('in if')
    client.textChannel = func.findChannel('text', client.guild.id)
    dmWarn(ch.guild, client.textChannel, client.voiceChannel)
  } else if (client.voiceChannel && client.voiceChannel.id === ch.id && !func.can(['SPEAK', 'CONNECT'], ch)) {
    client.voiceChannel = func.findChannel('voice', client.guild.id)
    dmWarn(ch.guild, client.textChannel, client.voiceChannel)
  } else if (!client.textChannel && ch.type === 0 && func.can(['SEND_MESSAGES'], ch)) {
    client.textChannel = {id: ch.id, name: ch.name}
  } else if (!client.voiceChannel && ch.type === 2 && func.can(['SPEAK', 'CONNECT'], ch)) {
    ch.join()
    client.voiceChannel = {id: ch.id, name: ch.name}
  } else {
    return
  }
  func.writeChanges()
})

bot.Dispatcher.on('GUILD_CREATE', e => {
  var guilds = []
  guilds.push(e.guild)
  func.log(`joined ${e.guild.name} guild`)
  sweepClients(guilds)
})

bot.Dispatcher.on('GUILD_DELETE', e => {
  var index = global.g.findIndex(s => s.guild.id === e.guildId)
  var client = func.getClient(e.guildId)
  func.log(`left ${client.guild.name} guild`)
  client.paused = true
  if (client.isPlaying) {
    client.encoder.destroy()
  }
  global.g.splice(index, 1)
  func.writeChanges()
})

bot.Dispatcher.on('GATEWAY_READY', () => {
  global.g = []
  func.log('online')
  bot.User.setGame('BZZT KILLING BZZT')
  fs.open(global.guildData, 'r', (err) => {
    var guilds = bot.Guilds.toArray()
    if (err) {
      func.log('no guild file')
      sweepClients(guilds)
    } else {
      var tmp = null
      var oldGuilds = JSON.parse(fs.readFileSync(global.guildData, 'utf-8'))
      if (oldGuilds.length === 0) {
        func.log('empty guild file')
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
          if (oldTextChannel && func.can(['SEND_MESSAGES'], oldTextChannel)) {
            tmp.textChannel = {id: oldTextChannel.id, name: oldTextChannel.name}
          } else {
            tmp.textChannel = func.findChannel('text', tmp.guild.id)
          }

          var oldVoiceChannel = null
          if (oldGuilds[i].voiceChannel) {
            oldVoiceChannel = bot.Channels.voiceForGuild(tmp.guild.id)
                      .find(c => c.id === oldGuilds[i].voiceChannel.id)
          }
          if (oldVoiceChannel && func.can(['SPEAK', 'CONNECT'], oldVoiceChannel)) {
            oldVoiceChannel.join()
            tmp.voiceChannel = {id: oldVoiceChannel.id, name: oldVoiceChannel.name}
          } else {
            tmp.voiceChannel = func.findChannel('voice', tmp.guild.id)
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
      if (cmd.handleCommand(msg, text.substring(1), false)) {
        if (func.can(['MANAGE_MESSAGES'], msg.channel)) {
          setTimeout(function () { msg.delete() }, 5000)
        }
      }
    } else if (func.getClient(msg.guild.id).meme) {
      if (func.can(['SEND_MESSAGES'], msg.channel)) {
        cmd.handleCommand(msg, text, true)
      }
    }
  }
})

function start () {
  fs.open(token, 'a+', () => {
    var tok = fs.readFileSync(token, 'utf-8').split('\n')[0]
    if (tok !== '') {
      fs.stat(global.playlist, (err) => {
        if (err) {
          func.log('making playlist folder')
          fs.mkdirSync('playlist')
        }
      })
      fs.stat('./data', (err) => {
        if (err) {
          func.log('making data folder')
          fs.mkdirSync('data')
        }
      })
      bot.connect({token: tok})
    } else {
      func.log('no token')
    }
  })
}

function sweepClients (guilds) {
  if (guilds.length !== 0) {
    for (var i = 0; i < guilds.length; i++) {
      var tmp = {}
      tmp.guild = {id: guilds[i].id, name: guilds[i].name}
      tmp.textChannel = func.findChannel('text', tmp.guild.id)
      tmp.voiceChannel = func.findChannel('voice', tmp.guild.id)
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
    gameRoles.sweepGames(global.g[i])
    if (guilds.find(s => s.id === global.g[i].guild.id) && global.g[i].autoplay &&
    bot.User.getVoiceChannel(global.g[i].guild.id).members.length !== 1) {
      music.autoQueue(global.g[i])
    }
  }
  func.writeChanges()
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
