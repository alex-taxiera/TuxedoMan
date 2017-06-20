const Discordie = require('discordie')
const fs = require('fs')
const token = './token.txt'

// global variables
global.guildData = './data/guilds.json'
global.playlist = './playlist'
global.g = [] //  g = guilds (list of guilds with all info)
global.bot = new Discordie({autoReconnect: true})

// project modules
var cmd = require('./commands.js')
var music = require('./music.js')
var func = require('./common.js')

// connect bot
start()

global.bot.Dispatcher.on('GUILD_MEMBER_UPDATE', e => {
  if (e.member.id === global.bot.User.id) {
    var client = e.member.guild.id
    if (client.textChannel && !func.can(['SEND_MESSAGES'], client.textChannel)) {
      client.textChannel = func.findChannel('text', client.guild.id)
    } else if (client.voiceChannel && !func.can(['SPEAK', 'CONNECT'], client.voiceChannel)) {
      client.voiceChannel = func.findChannel('voice', client.guild.id)
    } else if (!client.textChannel) {
      client.textChannel = func.findChannel('text', client.guild.id)
    } else if (!client.voiceChannel) {
      client.voiceChannel = func.findChannel('voice', client.guild.id)
    }
  }
})

global.bot.Dispatcher.on('CHANNEL_UPDATE', e => {
  var ch = e.channel
  var client = func.getClient(ch.guild.id)
  if (client.textChannel && client.textChannel.id === ch.id && !func.can(['SEND_MESSAGES'], client.textChannel)) {
    client.textChannel = func.findChannel('text', client.guild.id)
  } else if (client.voiceChannel && client.voiceChannel.id === ch.id && !func.can(['SPEAK', 'CONNECT'], client.voiceChannel)) {
    client.voiceChannel = func.findChannel('voice', client.guild.id)
  } else if (!client.textChannel && ch.type === 0 && func.can(['SEND_MESSAGES'], ch)) {
    client.textChannel = {id: ch.id, name: ch.name}
  } else if (!client.voiceChannel && ch.type === 2 && func.can(['SPEAK', 'CONNECT'], ch)) {
    ch.join()
    client.voiceChannel = {id: ch.id, name: ch.name}
  }
})

global.bot.Dispatcher.on('GUILD_ROLE_DELETE', e => {
  var client = func.getClient(e.guild.id)
  if (e.roleId === client.vip) {
    client.vip = null
    return func.writeChanges()
  } else if (client.gameRoles.roles.find(r => r === e.roleId)) {
    client.gameRoles.roles.splice(client.gameRoles.roles.findIndex(r => r === e.roleId), 1)
    func.writeChanges()
  }
})

global.bot.Dispatcher.on('PRESENCE_UPDATE', e => {
  var client = func.getClient(e.guild.id)
  if (e.member.guild_id && client.gameRoles.active) {
    var user = e.member
    var role = e.guild.roles.find(r => r.name === user.previousGameName)
    if (role && client.gameRoles.roles.find(r => r === role.id) && user.hasRole(role)) {
      func.unassignRole(user, role)
    }
    role = e.guild.roles.find(r => r.name === user.gameName)
    if (role && client.gameRoles.roles.find(r => r === role.id) && !user.hasRole(role)) {
      func.assignRole(user, role)
    }
  }
})

global.bot.Dispatcher.on('DISCONNECTED', e => {
  console.log(`${e.error}\nRECONNECT DELAY: ${e.delay}`)
})

global.bot.Dispatcher.on('VOICE_CHANNEL_LEAVE', e => {
  var client = func.getClient(e.guildId)
  if (e.user.id === global.bot.User.id) {
    console.log(`BZZT LEFT CHANNEL ${e.channel.name.toUpperCase()} BZZT`)
    if (!e.newChannelId) {
      var voiceChannel = global.bot.Channels.find(c => c.id === e.channelId)
      voiceChannel.join(voiceChannel).catch((e) => { console.log(e) })
    }
  } else if (client.isPlaying && client.encoder.voiceConnection && client.encoder.voiceConnection.channel.members.length === 1 && !client.paused) {
    client.paused = true
    client.encoder.voiceConnection.getEncoderStream().cork()
  }
})

global.bot.Dispatcher.on('VOICE_CHANNEL_JOIN', e => {
  var client = func.getClient(e.guildId)
  if (client.isPlaying && client.encoder.voiceConnection && client.encoder.voiceConnection.channel.members.length === 1 && !client.paused) {
    client.paused = true
    client.encoder.voiceConnection.getEncoderStream().cork()
  }
})

global.bot.Dispatcher.on('CHANNEL_CREATE', e => {
  var ch = e.channel
  var client = func.getClient(ch.guild_id)
  if (!client.textChannel || !client.voiceChannel) {
    if (ch.type === 0 && !client.textChannel && func.can(['SEND_MESSAGES'], ch)) {
      client.textChannel = {id: ch.id, name: ch.name}
    } else if (ch.type === 2 && !client.voiceChannel && func.can(['SPEAK', 'CONNECT'], ch)) {
      ch.join()
      client.voiceChannel = {id: ch.id, name: ch.name}
    }
    func.writeChanges()
  }
})

global.bot.Dispatcher.on('CHANNEL_DELETE', e => {
  var client = func.getClient(e.data.guild_id)
  var i
  if (e.channelId === client.textChannel.id) {
    var textChannels = global.bot.Channels.textForGuild(client.guild.id)
    for (i = 0; i < textChannels.length; i++) {
      if (func.can(['SEND_MESSAGES'], textChannels[i])) {
        client.textChannel = {id: textChannels[i].id, name: textChannels[i].name}
        break
      }
    }
    if (e.channelId === client.textChannel.id) {
      client.textChannel = undefined
    }
  } else if (e.channelId === client.voiceChannel.id) {
    var voiceChannels = global.bot.Channels.voiceForGuild(client.guild.id)
    for (i = 0; i < voiceChannels.length; i++) {
      if (func.can(['SPEAK', 'CONNECT'], voiceChannels[i])) {
        voiceChannels[i].join()
        client.voiceChannel = {id: voiceChannels[i].id, name: voiceChannels[i].name}
        break
      }
    }
    if (e.channelId === client.voiceChannel.id) {
      client.voiceChannel = undefined
    }
  } else {
    return
  }
  func.writeChanges()
})

global.bot.Dispatcher.on('GUILD_CREATE', e => {
  var guilds = []
  guilds.push(e.guild)
  console.log(`BZZT JOINED ${e.guild.name} GUILD BZZT`)
  sweepClients(guilds)
})

global.bot.Dispatcher.on('GUILD_DELETE', e => {
  var index = global.g.findIndex(s => s.guild.id === e.guildId)
  var client = func.getClient(e.guildId)
  console.log(`BZZT LEFT ${client.guild.name} GUILD BZZT`)
  client.paused = true
  if (client.isPlaying) {
    client.encoder.destroy()
  }
  global.g.splice(index, 1)
  func.writeChanges()
})

global.bot.Dispatcher.on('GATEWAY_READY', () => {
  global.g = []
  console.log('BZZT ONLINE BZZT')
  global.bot.User.setGame('BZZT KILLING BZZT')
  fs.open(global.guildData, 'r', (err) => {
    var guilds = global.bot.Guilds.toArray()
    if (err) {
      console.log('BZZT NO GUILD FILE BZZT')
      sweepClients(guilds)
    } else {
      var tmp
      var oldGuilds = JSON.parse(fs.readFileSync(global.guildData, 'utf-8'))
      if (oldGuilds.length === 0) {
        console.log('BZZT EMPTY GUILD FILE BZZT')
        return sweepClients(guilds)
      }
      var i
      for (i = 0; i < oldGuilds.length; i++) {
        tmp = undefined

        var guild = guilds.find(s => s.id === oldGuilds[i].guild.id)
        if (guild) {
          tmp = {}
          tmp.guild = {id: guild.id, name: guild.name}
          var oldTextChannel = global.bot.Channels.textForGuild(tmp.guild.id)
                    .find(c => c.id === oldGuilds[i].textChannel.id)
          if (oldTextChannel && func.can(['SEND_MESSAGES'], oldTextChannel)) {
            tmp.textChannel = {id: oldTextChannel.id, name: oldTextChannel.name}
          } else {
            tmp.textChannel = func.findChannel('text', tmp.guild.id)
          }

          var oldVoiceChannel = global.bot.Channels.voiceForGuild(tmp.guild.id)
                    .find(c => c.id === oldGuilds[i].voiceChannel.id)
          if (oldVoiceChannel && func.can(['SPEAK', 'CONNECT'], oldVoiceChannel)) {
            oldVoiceChannel.join()
            tmp.voiceChannel = {id: oldVoiceChannel.id, name: oldVoiceChannel.name}
          } else {
            tmp.voiceChannel = func.findChannel('voice', tmp.guild.id)
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

global.bot.Dispatcher.on('MESSAGE_CREATE', e => {
  var msg = e.message
  var text = msg.content
  if (msg.member.id !== global.bot.User.id) {
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
          console.log('BZZT NO PLAYLIST FOLDER BZZT\nBZZT MAKING PLAYLIST FOLDER BZZT')
          fs.mkdirSync('playlist')
        }
      })
      fs.stat('./data', (err) => {
        if (err) {
          console.log('BZZT NO DATA FOLDER BZZT\nBZZT MAKING DATA FOLDER BZZT')
          fs.mkdirSync('data')
        }
      })
      global.bot.connect({token: tok})
    } else {
      console.log('BZZT TOKEN EMPTY BZZT')
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
    func.sweepGames(global.g[i])
    if (guilds.find(s => s.id === global.g[i].guild.id) && global.g[i].autoplay && global.bot.User.getVoiceChannel(global.g[i].guild.id).members.length !== 1) {
      music.autoQueue(global.g[i])
    }
  }
  func.writeChanges()
}
