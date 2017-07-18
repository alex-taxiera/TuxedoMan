const db = require('../database.js')
const main = require('../../TuxedoMan.js')
const Command = require('./command.js')
const Response = require('../response.js')
const moment = require('moment')

module.exports = new Command(
  'prefs',
  'Display current bot preferences',
  [],
  'VIP',
  false,
  function (msg) {
    const bot = main.bot()
    let client = db.getGuildInfo(msg.guild.id)
    let guild = bot.Guilds.get(client.guild.id)
    let vipRole = getCleanVipRole(client, guild)
    let gameRoles = getCleanGameRoles(client, guild)

    let embed = {
      description: ':heartbeat: [**Preferences**](https://github.com/alex-taxiera/TuxedoMan)',
      thumbnail: {url: 'https://raw.githubusercontent.com/alex-taxiera/TuxedoMan/indev/images/tuxedoman.png'},
      timestamp: moment(),
      color: 0x3498db,
      footer: {
        icon_url: 'https://raw.githubusercontent.com/alex-taxiera/TuxedoMan/indev/images/tuxedoman.png',
        text: 'TuxedoMan'
      },
      fields: [{name: 'Default Text Channel', value: client.text.name},
          {name: 'Default Voice Channel', value: client.voice.name},
          {name: 'VIP Role', value: vipRole},
          {name: 'Announce Now Playing', value: client.informNowPlaying, inline: true},
          {name: 'Announce Autoplay', value: client.informAutoPlaying, inline: true},
          {name: 'Autoplay', value: client.autoplay, inline: true},
          {name: 'Memes', value: client.meme, inline: true},
          {name: 'Music Volume', value: `${client.volume * 2}`, inline: true},
          {name: 'Game Roles', value: gameRoles}]
    }
    return new Response(msg, '', 25000, embed)
  }
)

function getCleanVipRole (client, guild) {
  if (client.vip) {
    return guild.roles.find(r => r.id === client.vip).name
  } else {
    return 'None'
  }
}

function getCleanGameRoles (client, guild) {
  let gameRoles = ''

  if (client.gameRoles.active) {
    gameRoles += 'True\n'
  } else {
    gameRoles += 'False\n'
  }

  client.gameRoles.roles.forEach((gameRole, index) => {
    let role = guild.roles.find(r => r.id === gameRole)
    if (role) {
      gameRoles += `"${role.name}"`
      if (index !== (client.gameRoles.length - 1)) {
        gameRoles += ', '
      }
    }
  })
  return gameRoles
}
