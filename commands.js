var music = require('./music.js')
var func = require('./common.js')

module.exports =
{
  handleCommand: function (msg, text, meme) {
    var command = ''
    if (!meme) {
      var client = func.getClient(msg.guild.id)
      var params = text.split(' ')
      command = searchCommand(params[0])
      if (command) {
        if (params.length - 1 < command.parameters.length) {
          return msg.reply('Insufficient parameters!').then((m) => {
            setTimeout(function () { m.delete() }, 10000)
          })
        } else {
          if (rank(msg) >= command.rank) {
            func.messageHandler(command.execute(msg, params), client)
          } else if (rank(msg) < command.rank) {
            func.messageHandler(denyRank(msg, command.rank))
          }
          return true
        }
      }
    } else {
      command = searchCommand('memes')
      return command.execute(msg, text)
    }
  }
}

function searchCommand (commandName) {
  return (commands.find(cmd => cmd.command === commandName.toLowerCase()))
}

function denyRank (msg, rank) {
  var str = ''
  switch (rank) {
    case 1:
      str = `Must be in voice chat with ${global.bot.User.username}`
      return {promise: msg.reply(str), content: str}
    case 2:
      str = 'Must be VIP!'
      return {promise: msg.reply(str), content: str}
    case 3:
      str = 'Must be guild owner!'
      return {promise: msg.reply(str), content: str}
  }
}

function rank (msg) {
  var client = func.getClient(msg.guild.id)
  if (msg.guild.isOwner(msg.member)) {
    return 3
  } else if (client.vip && msg.member.hasRole(client.vip)) {
    return 2
  } else if (global.bot.User.getVoiceChannel(client.guild.id).members.findIndex(m => m.id === msg.member.id) !== -1) {
    return 1
  } else {
    return 0
  }
}

function checkGame (client, roleId) {
  var i
  var guild = global.bot.Guilds.toArray().find(g => g.id === client.guild.id)
  var role = guild.roles.find(r => r.id === roleId)
  if (client.gameRoles.roles.find(r => r === role.id)) {
    for (i = 0; i < guild.members.count; i++) {
      if (guild.members[i].gameName === role.name) {
        func.assignRole(guild.members[i], role)
      }
    }
  } else {
    for (i = 0; i < guild.members.count; i++) {
      if (guild.members[i].hasRole(role)) {
        func.unassignRole(guild.members[i], role)
      }
    }
  }
}

function getCleanVipRole (client, guild) {
  if (client.vip) {
    return guild.roles.find(r => r.id === client.vip).name
  } else {
    return 'None'
  }
}

function getCleanGameRoles (client, guild) {
  var gameRoles = ''
  if (client.gameRoles.active) {
    gameRoles += 'True\n'
  } else {
    gameRoles += 'False\n'
  }
  for (var i = 0; i < client.gameRoles.roles.length; i++) {
    var role = guild.roles.find(r => r.id === client.gameRoles.roles[i])
    if (role) {
      if (i) {
        gameRoles += ' '
      }
      gameRoles += `"${role.name}"`
    }
  }
  return gameRoles
}

function getFullParam (params) {
  var fullParam = ''
  for (var i = 1; i < params.length; i++) {
    if (i !== 1) {
      fullParam += ' '
    }
    fullParam += params[i]
  }
  return fullParam
}

var commands =
  [
    // commands
    {
      command: 'commands',
      description: 'Displays this message, duh!',
      parameters: [],
      rank: 0,
      execute: function (msg) {
        var str = 'Available commands:'
        for (var i = 0; i < commands.length; i++) {
          var c = commands[i]
          var rank = ''
          if (c.rank === 2) {
            rank = 'VIP'
          } else if (c.rank === 3) {
            rank = 'Owner'
          } else {
            rank = 'Anyone'
          }
          str += `\n* ${c.command} (${rank})`
          for (var j = 0; j < c.parameters.length; j++) {
            str += ` <${c.parameters[j]}>`
          }
          str += `: ${c.description}`
        }
        msg.member.openDM()
            .then(dm => {
              dm.sendMessage(str)
            })
        var retStr = 'Command list sent!'
        return {promise: msg.reply(retStr), content: retStr}
      }
    },
    // np
    {
      command: 'np',
      description: 'Displays the current song',
      parameters: [],
      rank: 0,
      execute: function (msg) {
        var client = func.getClient(msg.guild.id)
        var str = 'Now playing: '
        if (client.isPlaying) {
          str += `"${client.nowPlaying.title}" (requested by ${client.nowPlaying.user.username})`
        } else {
          str += 'nothing!'
        }
        return {promise: msg.reply(str), content: str}
      }
    },
    // queue
    {
      command: 'queue',
      description: 'Displays the queue',
      parameters: [],
      rank: 0,
      execute: function (msg) {
        var client = func.getClient(msg.guild.id)
        var str = ''
        if (client.queue.length === 0) {
          str = 'the queue is empty.'
        } else {
          for (var i = 0; i < client.queue.length; i++) {
                    // 17 because the "and more" string is 17 characters long before the number is added
                    // the remaining videos in queue can never be more than max queue, so compare against max queue to be safe
            if (str.length + 17 + client.queue.length.toString().length + client.queue[i].title.length + client.queue[i].user.username.length < 2000) {
              str += `"${client.queue[i].title}" (requested by ${client.queue[i].user.username}) `
            } else {
              str += `\n**...and ${(client.queue.length - i - 1)} more.**`
              break
            }
          }
        }
        return {promise: msg.reply(str), content: str}
      }
    },
    // volume
    {
      command: 'volume',
      description: 'Set music volume.',
      parameters: ['number (1-200)'],
      rank: 1,
      execute: function (msg, params) {
        var str = ''
        if (params[1] / 2 > 0 && params[1] / 2 <= 100) {
          var client = func.getClient(msg.guild.id)
          if (params[1] / 2 === client.volume) {
            str = 'Volume is already at that level!'
            return {promise: msg.reply(str), content: str}
          } else {
            music.volume(client, params[1] / 2)
            str = 'Volume set!'
            return {promise: msg.reply(str), content: str}
          }
        } else {
          str = 'Invalid volume level!'
          return {promise: msg.reply(str), content: str}
        }
      }
    },
    // play
    {
      command: 'play',
      description: 'Resumes paused/stopped playback',
      parameters: [],
      rank: 1,
      execute: function (msg) {
        var client = func.getClient(msg.guild.id)
        var str = ''
        if (!client.isPlaying && client.queue.length === 0) {
          if (client.autoplay) {
            client.paused = false
            music.autoQueue(client)
            str = 'Starting!'
            return {promise: msg.reply(str), content: str}
          } else {
            str = 'Turn autoplay on, or use search or request to pick a song!'
            return {promise: msg.reply(str), content: str}
          }
        } else if (client.paused) {
          client.paused = false
          if (client.isPlaying) {
            client.encoder.voiceConnection.getEncoderStream().uncork()
          }
          str = 'Resuming!'
          return {promise: msg.reply(str), content: str}
        } else {
          str = 'Playback is already running'
          return {promise: msg.reply(str), content: str}
        }
      }
    },
    // pause
    {
      command: 'pause',
      description: 'Pauses your shit',
      parameters: [],
      rank: 1,
      execute: function (msg) {
        var client = func.getClient(msg.guild.id)
        var str = ''
        if (client.paused) {
          str = 'Playback is already paused!'
          return {promise: msg.reply(str), content: str}
        } else {
          client.paused = true
          if (client.isPlaying) {
            client.encoder.voiceConnection.getEncoderStream().cork()
          }
          str = 'Pausing!'
          return {promise: msg.reply(str), content: str}
        }
      }
    },
    // stop
    {
      command: 'stop',
      description: 'Delete current song and prevent further playback',
      parameters: [],
      rank: 1,
      execute: function (msg) {
        var client = func.getClient(msg.guild.id)
        var str = ''
        if (client.isPlaying) {
          client.paused = true
          client.encoder.destroy()
          client.nowPlaying = {}
          str = 'Stopping...'
          return {promise: msg.reply(str), content: str}
        } else {
          str = 'Bot is not playing anything!'
          return {promise: msg.reply(str), content: str}
        }
      }
    },
    // skip
    {
      command: 'skip',
      description: 'Skips the current song',
      parameters: [],
      rank: 1,
      execute: function (msg) {
        var client = func.getClient(msg.guild.id)
        var str = ''
        if (client.isPlaying) {
          client.encoder.destroy()
          str = 'Skipping...'
          return {promise: msg.reply(str), content: str}
        } else {
          str = 'There is nothing being played.'
          return {promise: msg.reply(str), content: str}
        }
      }
    },
    // request
    {
      command: 'request',
      description: 'Adds the requested video to the playlist queue',
      parameters: ['video URL, video ID, playlist URL or alias'],
      rank: 1,
      execute: function (msg, params) {
        var regExp = /^.*(youtu.be\/|list=)([^#&?]*).*/
        var match = params[1].match(regExp)

        if (match && match[2]) {
          return music.queuePlaylist(match[2], msg)
        } else {
          func.log(`request video on ${func.getClient(msg.guild.id).guild.name}`)
          return music.addToQueue(params[1], msg)
        }
      }
    },
    // search
    {
      command: 'search',
      description: 'Searches for a video or playlist on YouTube and adds it to the queue',
      parameters: ['query'],
      rank: 1,
      execute: function (msg, params) {
        var fullParam = getFullParam(params)
        func.log(`search video on${func.getClient(msg.guild.id).guild.name}`)
        return music.searchVideo(msg, fullParam)
      }
    },
    // clearqueue
    {
      command: 'clearqueue',
      description: 'Removes all songs from the queue',
      parameters: [],
      rank: 2,
      execute: function (msg) {
        var client = func.getClient(msg.guild.id)
        var str = ''
        client.queue = []
        str = 'Queue has been cleared!'
        return {promise: msg.reply(str), content: str}
      }
    },
    // remove
    {
      command: 'remove',
      description: 'Removes a song from the queue',
      parameters: ["Request index or 'last'"],
      rank: 2,
      execute: function (msg, params) {
        var index = params[1]
        var client = func.getClient(msg.guild.id)
        var str = ''
        if (client.queue.length === 0) {
          str = 'The queue is empty'
          return {promise: msg.reply(str), content: str}
        } else if (isNaN(index) && index !== 'last') {
          str = `Argument "${index}" is not a valid index.`
          return {promise: msg.reply(str), content: str}
        }

        if (index === 'last') { index = client.queue.length }
        index = parseInt(index)
        if (index < 1 || index > client.queue.length) {
          str = `Cannot remove request #${index} from the queue (there are only ${client.queue.length} requests currently)`
          return {promise: msg.reply(str), content: str}
        }

        var deleted = client.queue.splice(index - 1, 1)
        str = `Request "${deleted[0].title}" was removed from the queue.`
        return {promise: msg.reply(str), content: str}
      }
    },
    // toggle
    {
      command: 'toggle',
      description: 'Toggle various settings',
      parameters: [`Alias: auto|np|autonp|gameroles|memes`],
      rank: 2,
      execute: function (msg, params) {
        var client = func.getClient(msg.guild.id)
        var str = ''
        switch (params[1]) {
          case 'auto':
            client.autoplay = !client.autoplay
            if (client.autoplay && global.bot.User.getVoiceChannel(msg.guild).members.length !== 1) {
              client.paused = false
              music.autoQueue(client)
            }
            func.writeChanges()
            str = `Autoplay set to ${client.autoplay}!`
            return {promise: msg.reply(str), content: str}
          case 'np':
            client.informNowPlaying = !client.informNowPlaying
            func.writeChanges()
            str = `Now Playing announcements set to ${client.informNowPlaying}!`
            return {promise: msg.reply(str), content: str}
          case 'autonp':
            client.informAutoPlaying = !client.informAutoPlaying
            func.writeChanges()
            str = `Now Playing (autoplay) announcements set to ${client.informAutoPlaying}!`
            return {promise: msg.reply(str), content: str}
          case 'gameroles':
            client.gameRoles.active = !client.gameRoles.active
            str = `Game roles set to ${client.gameRoles.active}!`
            func.sweepGames(client)
            func.writeChanges()
            return {promise: msg.reply(str), content: str}
          case 'memes':
            client.meme = !client.meme
            func.writeChanges()
            str = `Meme posting set to ${client.meme}!`
            return {promise: msg.reply(str), content: str}
          default:
            str = 'Specify option to toggle!'
            return {promise: msg.reply(str), content: str}
        }
      }
    },
    // add game roles
    {
      command: 'addgamerole',
      description: 'Add game roles',
      parameters: ['role name, should be as game appears on discord statuses'],
      rank: 2,
      execute: function (msg, params) {
        var fullParam = getFullParam(params)
        var client = func.getClient(msg.guild.id)
        var str = ''
        var exists = msg.guild.roles.find(r => r.name === fullParam)
        if (exists) {
          if (!client.gameRoles.roles.find(r => r === exists.id)) {
            client.gameRoles.roles.push(exists.id)
            checkGame(client, exists.id)
            func.writeChanges()
            str = `Added "${fullParam}" to game roles!`
            return {promise: msg.reply(str), content: str}
          } else {
            str = `"${fullParam}" already in list!`
            return {promise: msg.reply(str), content: str}
          }
        } else {
          str = msg.guild.createRole()
          .then((role) => {
            role.commit(fullParam, 0, true)
            .then(() => {
              client.gameRoles.roles.push(role.id)
              checkGame(client, role.id)
              func.writeChanges()
              str = `"${fullParam}" created and added to game roles!`
              func.messageHandler({promise: msg.reply(str), content: str}, client)
            })
          })
          .catch((e) => {
            func.log(`cannot create role`, e)
            str = `Could not create role "${fullParam}"`
            func.messageHandler({promise: msg.reply(str), content: str}, client)
          })
        }
      }
    },
    // delete game roles
    {
      command: 'delgamerole',
      description: 'Delete game roles',
      parameters: ['role name'],
      rank: 2,
      execute: function (msg, params) {
        var fullParam = getFullParam(params)
        var client = func.getClient(msg.guild.id)
        var str = ''
        var role = msg.guild.roles.find(r => r.name === fullParam)
        if (role) {
          var index = client.gameRoles.roles.findIndex(r => r === role.id)
          if (index !== -1) {
            client.gameRoles.roles.splice(index, 1)
            str = `Deleted "${fullParam}" from game roles!`
            checkGame(client, role.id)
            func.writeChanges()
            return {promise: msg.reply(str), content: str}
          } else {
            str = `"${fullParam}" not in list!`
            return {promise: msg.reply(str), content: str}
          }
        } else {
          str = `"${fullParam}" does not exist in this guild!`
          return {promise: msg.reply(str), content: str}
        }
      }
    },
    // set
    {
      command: 'set',
      description: 'Set default voice or text channel',
      parameters: [`"voice/text"`, 'channel name'],
      rank: 2,
      execute: function (msg, params) {
        var client = func.getClient(msg.guild.id)
        var str = ''
        var type = params[1]
        params.splice(0, 1)
        var fullParam = getFullParam(params)
        var channel = {}
        if (type === `text`) {
          channel = global.bot.Channels.textForGuild(msg.guild).find(tc => tc.name === fullParam)
          type = 0 // false for text
        } else if (type === 'voice') {
          channel = global.bot.Channels.voiceForGuild(msg.guild).find(vc => vc.name === fullParam)
          type = 1 // true for voice
        } else {
          str = 'Specify text or voice with first param!'
          return {promise: msg.reply(str), content: str}
        }
        if (channel) {
          if (client.textChannel.id !== channel.id && client.voiceChannel.id !== channel.id) {
            if (!type) {
              if (func.can(['SEND_MESSAGES'], channel)) {
                client.textChannel = {id: channel.id, name: channel.name}
                func.writeChanges()
                str = 'Default set!'
                return {promise: msg.reply(str), content: str}
              } else {
                str = 'Cannot send messages there!'
                return {promise: msg.reply(str), content: str}
              }
            } else if (type) {
              if (func.can(['CONNECT'], channel)) {
                if (func.can(['SPEAK'], channel)) {
                  client.voiceChannel = {id: channel.id, name: channel.name}
                  func.writeChanges()
                  channel.join()
                  str = 'Default set!'
                  return {promise: msg.reply(str), content: str}
                } else {
                  str = 'Cannot speak in that channel!'
                  return {promise: msg.reply(str), content: str}
                }
              } else {
                str = 'Cannot connect to that channel!'
                return {promise: msg.reply(str), content: str}
              }
            }
          } else {
            str = 'Already default channel!'
            return {promise: msg.reply(str), content: str}
          }
        } else {
          str = `Could not find ${params[1]} channel!`
          return {promise: msg.reply(str), content: str}
        }
      }
    },
    // prefs
    {
      command: 'prefs',
      description: 'Display current bot preferences',
      parameters: [],
      rank: 2,
      execute: function (msg) {
        var client = func.getClient(msg.guild.id)
        var guild = global.bot.Guilds.toArray().find(g => g.id === client.guild.id)
        var vipRole = getCleanVipRole(client, guild)
        var gameRoles = getCleanGameRoles(client, guild)

        var str = 'Preferences'
        var embed =
          {
            color: 0x3498db,
            fields: [{name: 'Default Text Channel', value: client.textChannel.name},
                {name: 'Default Voice Channel', value: client.voiceChannel.name},
                {name: 'VIP Role', value: vipRole},
                {name: 'Autoplay', value: client.autoplay},
                {name: 'Announce Now Playing', value: client.informNowPlaying},
                {name: 'Announce Now Playing from Autoplay', value: client.informAutoPlaying},
                {name: 'Memes', value: client.meme},
                {name: 'Music Volume', value: `${client.volume * 2}`},
                {name: 'Game Roles', value: gameRoles}]
          }
        return {promise: msg.reply(str, false, embed), content: str, delay: 25000, embed: embed}
      }
    },
    // vip
    {
      command: 'vip',
      description: 'Set VIP role',
      parameters: ['role name'],
      rank: 3,
      execute: function (msg, params) {
        var fullParam = getFullParam(params)
        var client = func.getClient(msg.guild.id)
        var str = ''
        var role = msg.guild.roles.find(r => r.name === fullParam)
        if (role) {
          if (role !== client.vip) {
            client.vip = role.id
            func.writeChanges()
            str = 'VIP set!'
            return {promise: msg.reply(str), content: str}
          } else {
            str = 'VIP is already set to that role!'
            return {promise: msg.reply(str), content: str}
          }
        } else {
          str = `Could not find role "${fullParam}"`
          return {promise: msg.reply(str), content: str}
        }
      }
    },
    // meme hell
    {
      // meme hell
      command: 'memes',
      description: 'Memes',
      parameters: [],
      execute: function (msg, text) {
        text = text.toLowerCase()
        var client = func.getClient(msg.guild.id)
            // MEME HELL DO NOT GO BELOW

            // DVA EXAMPLE
        if (text.includes(' dva ') || text === 'dva') {
          msg.channel.uploadFile('./images/kek.png')
        }
            // ayya
        if (text.includes(' ayya ') || text === 'ayya') {
          msg.channel.sendMessage('AYYA AYYA AYYA')
        }
            // panda
        if (text.includes(' panda ') || text === 'panda') {
          msg.channel.sendMessage('Panda\nPanda\nPanda\nPanda\nPanda')
        }
            // stain
        if (text.includes(' stain ') || text === 'stain') {
          msg.channel.sendMessage('STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN')
        }
            // baby
        if (text.includes(' baby ') || text === 'baby') {
          msg.channel.uploadFile('./images/baby.gif', './images/baby.gif')
        }
            // ban
        if (text.includes(' ban ') || text === 'ban') {
          msg.channel.uploadFile('./images/ban.jpg')
        }
            // bb
        if (text.includes(' bb ') || text === 'bb') {
          msg.channel.sendMessage('Big Brother is watching™')
        }
            // black
        if (text.includes(' black ') || text === 'black') {
          msg.channel.sendMessage("'I hate black people, I swear' ~Fig 2016")
        }
            // blueberry
        if (text.includes(' blueberry pie ') || text === 'blueberry pie') {
          msg.channel.sendMessage("BLUEBERRY FUCKING PIE? WHAT KIND OF FILTHY, UNWASHED, DEGENERATES DECIDED TO COME UP WITH THIS SHIT. FIRST YOU GIVE PEOPLE THE POWER TO DICTATE THEIR CREAM FILLING, NOW YOU'RE LETTING THEM CONDENSE A HOME COOKED PASTRY INTO A BITE SIZED CRUMPET SHIT? REALLY? FUCKING REALLY? I AM GOING TO FIND WHEVER MADE THIS ONLY TO DISEMBOWLE THEM, INFLATE THEIR ORGANS AND SHOVE THEM BACK INSIDE, SO THAT THEIR BODY RESEMBLES THE BLUEBERRY GIRL IN CHARLIE AND THE CHOCOLA-FUCKING-TE FACTA-FUCKING-ORY. THAT'S RIGHT. THAT'S WHO CREATED THIS. IT'S EVIL AND I SHALL HAVE NO PART OF IT. IF YOU HAVE A CONCIENSE, OR ANY SEMPLENCE OF A SOUL, YOU WILL THROW THOSE AWAY, OR BETTER YET, BURN THEM AND SPREAD THEIR ASHES THOROUGHLY INTO A VENUS FLYTRAP FLOWERBED. THAT IS ALL.")
        }
            // boob
        if (text.includes(' boob ') || text === 'boob') {
          msg.channel.uploadFile('./images/underboob.jpg')
        }
            // bruh
        if (text === 'bruh') {
          msg.channel.uploadFile('./images/bruh.jpg')
        }
            // bye
        if (text.includes(' bye ') || text === 'bye') {
          msg.channel.uploadFile('./images/bye.gif', './images/bye.gif')
        }
            // daddy
        if (text.includes(' daddy ') || text === 'daddy') {
          msg.channel.sendMessage('<@192158164798406658>')
        }
            // danganroppa
        if (text.includes('danganroppa')) {
          msg.channel.sendMessage('Dangit Wrongpan?')
        }
            // debbie
        if (text.includes('debbie')) {
          msg.channel.sendMessage('WHAT WILL DEBBIE THINK!')
        }
            // dilligaf
        if (text.includes('dilligaf')) {
          msg.channel.uploadFile('./images/dilligaf.png')
        }
            // doyoueven
        if (text.includes(' doyoueven ') || text === 'doyoueven' || text.includes('do you even ') || text === 'do you even') {
          msg.channel.uploadFile('./images/doyoueven.jpg')
        }
            // dozicus
        if (text.includes('dozicus')) {
          msg.channel.sendMessage('DozicusPrimeTheDestroyerOfWorldsFredButtonIdiotMushroomBurger Stormborn of house targaryen, first of her name, queen of the andals and first men, khaleesi, mother of dragons and breaker of chains.')
        }
            // embargo
        if (text.includes('embargo')) {
          msg.channel.sendMessage('But now, Gwilith was dead. His world had turned into his worst enemy, and now the only thing he knew was the wind. This was the beginning of Embargo. This was the beginning of the end. <@185936558036090880>')
        }
            // fig
        if (text.includes(' fig ') || text === 'fig') {
          msg.channel.sendMessage('WHAT WOULD FIG DO!')
          msg.channel.sendMessage("'I hate black people, I swear' ~Fig 2016")
        }
            // gg
        if (text.includes(' gg ') || text === 'gg') {
          msg.channel.sendMessage('<:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128> <:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128> <:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128> <:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128> <:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128>')
        }
            // goodshit
        if (text.includes('goodshit') || text.includes('good shit')) {
          msg.channel.sendMessage('👌👀👌👀👌👀👌👀👌👀 good shit go౦ԁ sHit👌 thats ✔ some good👌👌shit right👌👌th 👌 ere👌👌👌 right✔there ✔✔if i do ƽaү so my selｆ 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 👌👌 👌НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ👌 👌👌 👌 💯 👌 👀 👀 👀 👌👌Good shit')
        }
            // highfive
        if (text.includes('highfive') || text.includes('high five')) {
          msg.channel.uploadFile('./images/highfive.jpg')
        }
            // hue
        if (text.includes('hue')) {
          msg.channel.sendMessage('HUE+HUE+HUE+HUE+HUE+HUE+HUE+HUE+')
        }
            // ignis
        if (text.includes('ignis')) {
          msg.channel.uploadFile('./images/ignis.gif', './images/ignis.gif')
        }
            // iwata
        if (text.includes('iwata')) {
          msg.channel.uploadFile('./images/iwata.jpg')
        }
            // jon
        if (text.includes(' jon ') || text === 'jon') {
          msg.channel.uploadFile('./images/jon.gif', './images/jon.gif')
        }
            // left
        if (text.includes(' left ') || text === 'left') {
          msg.channel.uploadFile('./images/left.jpg')
        }
            // lmao
        if (text.includes('lmao')) {
          client.lmaoCount++
          if (client.lmaoCount > 10) {
            client.lmaoCount = 0
            msg.channel.sendMessage("What the ayy did you just fucking lmao about me, you ayy lmao? I'll have you know I graduated top of my ayy in the Lmaos, and I've been involved in numerous Lmao's on Ayyl-Quaeda, and I have over 300 confirmed lmaos. I am trained in ayy lmao and I'm the top ayy in the entire US lmao. You are nothing to me but just another ayy. I will ayy you the fuck lmao with ayy the likes of which has never been seen lmao'd on this Earth, mark my ayy lmao. You think you can get away with ayying that lmao to me over the Internet? Think again, fucker. As we speak I am ayying my secret network of lmaos across the USA and your ayy is being traced right now so you better prepare for the lmao, maggot. The lmao that ayys out the pathetic little thing you call your lmao. You're ayy lmao, kid. I can ayy anywhere, anytime, and I can lmao you in over seven hundred ways, and that's just with my bare lmao. Not only am I extensively trained in ayy lmao, but I have access to the entire ayy of the United States Lmao and I will use it to its full extent to ayy your miserable lmao off the face of the continent, you little shit. If only you could have known what unholy ayy your little “clever” lmao was about to bring down upon you, maybe you would have held your fucking ayy. But you couldn’t, you didn’t, and now you’re ayying the lmao, you goddamn idiot. I will ayy lmao all over you and you will ayy in it. You’re fucking lmao, kiddo")
          }
        }
            // mao
        if (text.includes(' mao ') || text === 'mao') {
          msg.channel.uploadFile('./images/mao.jpg')
        }
            // minarah
        if (text.includes('minarah')) {
          msg.channel.sendMessage("Minarah Dark Blade the Black Rose, she grew up a bandit, a warrior, was trained as an assassin. She's had a hard life. She's *not* a hero. <@119963118016266241>")
        }
            // miyamoto
        if (text.includes('miyamoto')) {
          msg.channel.uploadFile('./images/miyamoto.gif', './images/miyamoto.gif')
        }
            // myswamp
        if (text.includes('swamp')) {
          if (client.swamp) {
            client.swamp = false
            msg.channel.uploadFile('./images/swamp1.png')
          } else {
            client.swamp = true
            msg.channel.uploadFile('./images/swamp2.png')
          }
        }
            // nebby
        if (text.includes('nebby')) {
          msg.channel.uploadFile('./images/nebby.gif', './images/nebby.gif')
        }
            // pedo
        if (text.includes('pedo')) {
          msg.channel.uploadFile('./images/pedo.png')
        }
            // pepe
        if (text.includes(' pepe ') || text === 'pepe') {
          msg.channel.sendMessage("*FUCKING PEPE,THAT SCUM ON MY BALLSACK!. FUCK THAT BUNDLE OF STICKS SHOVING UP HIS ASS HAVING 'I LIVE WITH MY MOM' JORDAN 3'S WEARING MOTHERHUGGER! THAT SOUTHERN, 'I CHEATED ON MY SISTER WITH MY MOTHER' COUNTRY ASS MOTHERHUGGER. BUT YEAH, FUCK HIM...*")
        }
            // petyr
        if (text.includes('petyr')) {
          msg.channel.uploadFile('./images/petyr.jpeg')
        }
            // pls
        if (text.includes('please the team') || text.includes('pleasetheteam') || text === 'pls') {
          msg.channel.uploadFile('./images/pls.gif', './images/pls.gif').then((m) => {
            setTimeout(function () { m.delete() }, 30000)
          })
        }
            // poopkink
        if (text.includes('poopkink')) {
          msg.channel.sendMessage('http://www.poopkink.com')
        }
            // pushthepayload
        if (text.includes('payload')) {
          msg.channel.uploadFile('./images/payload.gif', './images/payload.gif')
        }
            // snorlax
        if (text.includes('snorlax')) {
          msg.channel.uploadFile('./images/snorlax.gif', './images/snorlax.gif')
        }
            // sonicno
        if (text.includes('sonicno') || text.includes('sonic no')) {
          msg.channel.uploadFile('./images/sonicno.jpg')
        }
            // spookyshit
        if (text.includes('spookyshit') || text.includes('spooky shit')) {
          msg.channel.sendMessage('🎃👻🎃👻🎃👻👻👻🎃👻 spooky shit spooky sHit🎃 thats ✔ some spooky🎃🎃shit right🎃🎃th 🎃 ere🎃🎃🎃 right✔there ✔✔if i do ƽaү so my selｆ 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 🎃🎃 🎃НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ🎃 🎃 🎃 🎃 💯 🎃 👻👻 👻 🎃🎃spooky shit 🎃👻🎃👻🎃👻👻👻🎃👻 spooky shit spooky sHit🎃 thats ✔ some spooky🎃🎃shit right🎃🎃th 🎃 ere🎃🎃🎃 right✔there ✔✔if i do ƽaү so my selｆ 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 🎃🎃 🎃НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ🎃 🎃 🎃 🎃 💯 🎃 👻👻 👻 🎃🎃spooky shit')
        }
            // tbc
        if (text.includes('tbc') || text.includes('tobecontinued') || text.includes('to be continued')) {
          msg.channel.uploadFile('./images/tbc.png')
        }
            // valor
        if (text.includes('valor')) {
          msg.channel.uploadFile('./images/valor.png')
        }
            // who
        if (text.includes('who are th') || text === 'who') {
          msg.channel.uploadFile('./images/people.gif', './images/people.gif')
        }
            // womb
        if (text.includes('womb')) {
          msg.channel.uploadFile('./images/womb.gif', './images/womb.gif')
        }
      }
    }
  ]
