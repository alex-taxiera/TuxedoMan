const Eris = require('eris')
const rng = require('seedrandom')()

// project modules
const config = require('./config.json')
const { common, gameRoles, music, database, commands, memes } = require('./modules')

const tok = config.token
if (tok !== '') {
  var bot = new Eris(tok)
  bot.connect()
} else {
  common.log('no token', 'red')
}

module.exports = bot

// events
bot.on('guildMemberUpdate', (guild, member) => {
  if (member.id === bot.user.id) {
    database.checkChannels(guild)
  }
})

bot.on('guildRoleDelete', (guild, role) => {
  let id = guild.id
  let vip = database.getGuildInfo(id).vip

  if (role.id === vip) {
    vip = null
  } else {
    gameRoles.checkRole(id, role.id)
  }
})

bot.on('presenceUpdate', (member, old) => {
  if (!member.bot) {
    gameRoles.checkMember(member.guild.id, member.guild, member, old.game)
  }
})

bot.on('disconnect', () => {
  common.log('disconnected', 'red')
})

bot.on('error', (e) => {
  common.log('error', 'red', e.message)
})

bot.on('voiceChannelSwitch', (member, newChannel, oldChannel) => {
  let guild = member.guild
  if (member.id === bot.user.id) {
    common.log(`switched from ${oldChannel.name} to ${newChannel.name}`, 'yellow')

    let voiceChannel = bot.Channels.get(newChannel.id)
    voiceChannel.join(voiceChannel)
    .then(() => { music.checkPlayer(guild) })
    .catch((e) => { common.log(null, 'red', e) })
  } else {
    music.checkPlayer(guild)
  }
})

bot.on('voiceChannelLeave', (member, channel) => {
  if (member.id === bot.user.id) {
    common.log(`left channel ${channel.name}`, 'yellow')
  } else {
    music.checkPlayer(member.guild)
  }
})

bot.on('channelCreate', (channel) => {
  if (channel.guild) {
    let ch = channel
    let guildInfo = database.getGuildInfo(ch.guild.id)
    let text = guildInfo.text
    let voice = guildInfo.voice

    if (!text || !voice) {
      if (ch.type === 0 && !text &&
      common.can(['sendMessages', 'readMessages'], ch)) {
        guildInfo.text = { id: ch.id, name: ch.name }
      } else if (ch.type === 2 && !voice &&
      common.can(['voiceSpeak', 'voiceConnect'], ch)) {
        ch.join()
        .then(() => { music.checkPlayer(ch.guild) })
        guildInfo.voice = { id: ch.id, name: ch.name }
      }
    }
  }
})

bot.on('channelDelete', (channel) => {
  database.checkChannels(channel.guild)
})

bot.on('channelUpdate', (channel) => {
  database.checkChannels(channel.guild, channel.id)
})

bot.on('guildCreate', (guild) => {
  common.log(`joined ${guild.name} guild`, 'green')
  database.addClient(guild)
})

bot.on('guildDelete', (guild) => {
  let id = guild.id
  common.log(`left ${guild.name} guild`, 'yellow')

  music.destroy(id)
  database.removeClient(id)
})

bot.on('ready', () => {
  common.log('online', 'green')
  setGame()
  music.initialize(bot.guilds)
  database.initialize(bot.guilds)
  gameRoles.initialize(bot.guilds)
})

bot.on('messageCreate', (msg) => {
  if (msg.member && msg.member.id !== bot.user.id) {
    let text = msg.content
    if (text[0] === '*') {
      commands.handleCommand(msg, text.substring(1))
    } else if (database.getGuildInfo(msg.channel.guild.id).meme) {
      if (common.can(['sendMessages'], msg.channel)) {
        memes(msg, text)
      }
    }
  }
})

// helpers
function setGame () {
  let games = config.games
  let name = games[Math.floor(rng() * games.length)]
  common.log(`playing ${name}`, 'cyan')
  bot.editStatus('online', { name })
  setTimeout(() => { setGame() }, 43200000) // 43200000
}
