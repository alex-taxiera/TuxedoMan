const db = require('../database.js')
const Command = require('../classes/Command.js')
const Response = require('../classes/Response.js')
const moment = require('moment')

module.exports = new Command(
  'prefs',
  'Display current bot preferences',
  [],
  'VIP',
  function (msg) {
    let id = msg.guild.id
    let guildInfo = db.getGuildInfo(id)
    let playerInfo = db.getPlayerInfo(id)
    let guild = require('../../TuxedoMan.js').Guilds.get(id)
    let vipRole = getCleanVipRole(guildInfo, guild)
    let gameRoles = getCleanGameRoles(db.getGameRolesInfo(id), guild)

    let embed = {
      description: ':heartbeat: [**Preferences**](https://github.com/alex-taxiera/TuxedoMan)',
      thumbnail: {url: 'https://raw.githubusercontent.com/alex-taxiera/TuxedoMan/indev/images/tuxedoman.png'},
      timestamp: moment(),
      color: 0x3498db,
      footer: {
        icon_url: 'https://raw.githubusercontent.com/alex-taxiera/TuxedoMan/indev/images/tuxedoman.png',
        text: 'TuxedoMan'
      },
      fields: [
        {name: 'Default Text Channel', value: guildInfo.text.name},
        {name: 'Default Voice Channel', value: guildInfo.voice.name},
        {name: 'VIP Role', value: vipRole},
        {name: 'Announce Now Playing', value: playerInfo.informNowPlaying, inline: true},
        {name: 'Announce Autoplay', value: playerInfo.informAutoPlaying, inline: true},
        {name: 'Autoplay', value: playerInfo.autoplay, inline: true},
        {name: 'Memes', value: guildInfo.meme, inline: true},
        {name: 'Music Volume', value: `${playerInfo.volume}`, inline: true},
        {name: 'Game Roles', value: gameRoles}
      ]
    }
    return new Response(msg, '', 25000, embed)
  }
)

function getCleanVipRole (guildInfo, guild) {
  if (guildInfo.vip) {
    return guild.roles.find(r => r.id === guildInfo.vip).name
  } else {
    return 'None'
  }
}

function getCleanGameRoles (gameRolesInfo, guild) {
  let gameRoles = ''

  if (gameRolesInfo.active) {
    gameRoles += 'Active\n'
  } else {
    gameRoles += 'Inactive\n'
  }

  gameRolesInfo.roles.forEach((gameRole, index) => {
    let role = guild.roles.find(r => r.id === gameRole)
    if (role) {
      gameRoles += `"${role.name}"`
      if (index !== (gameRolesInfo.roles.length - 1)) {
        gameRoles += ', '
      }
    }
  })
  if (gameRolesInfo.other.active) {
    gameRoles += '\nOther Role Active\nOther Role: '
  } else {
    gameRoles += '\nOther Role Inactive\nOther Role: '
  }
  let otherRole = guild.roles.find(r => r.id === gameRolesInfo.other.role)
  if (otherRole) {
    gameRoles += `"${otherRole.name}"`
  }
  return gameRoles
}
