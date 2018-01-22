const fs = require('fs')
const func = require('./common.js')
const Client = require('./classes/Client.js')
const data = './data/guilds/'

let clientMap = new Map()

module.exports = {
  initialize: function (guilds) {
    let saves = fs.readdirSync(data).filter((file) => {
      return file.slice(-5) === '.json'
    })
    saves.forEach((save) => {
      save = save.slice(0, -5)
      let guild = guilds.get(save)
      if (!guild) {
        remove(save)
      } else {
        let tmp = {}
        tmp.guild = { id: guild.id, name: guild.name }

        let saveData = JSON.parse(fs.readFileSync(file(save)))
        let savedGuild = saveData.guildInfo
        if (savedGuild.text) {
          let text = guild.channels.get(savedGuild.text.id)
          if (text && func.can(['sendMessages', 'readMessages'], text)) {
            tmp.text = { id: text.id, name: text.name }
          } else {
            tmp.text = func.findChannel('text', guild.id)
          }
        } else {
          tmp.text = func.findChannel('text', guild.id)
        }

        if (savedGuild.voice) {
          let voice = guild.channels.get(savedGuild.voice.id)
          if (voice && func.can(['voiceSpeak', 'voiceConnect'], voice)) {
            voice.join()
            .then(() => { require('./music.js').checkPlayer(guild, true) })
            tmp.voice = { id: voice.id, name: voice.name }
          } else {
            tmp.voice = func.findChannel('voice', guild.id)
          }
        } else {
          tmp.voice = func.findChannel('voice', guild.id)
        }

        if (!tmp.text || !tmp.voice) {
          func.dmWarn(guild, tmp.text, tmp.voice)
        }

        let client = new Client(
          tmp.guild,
          tmp.text,
          tmp.voice,
          savedGuild.vip,
          savedGuild.meme,
          saveData.playerInfo,
          saveData.gameRolesInfo
        )
        clientMap.set(guild.id, client)
        write(guild.id, client)
      }
    })

    guilds.forEach((guild) => {
      if (!clientMap.get(guild.id)) {
        add(guild)
      }
    })
  },
  addClient: function (guild) {
    add(guild)
  },
  removeClient: function (id) {
    remove(id)
  },
  getClient: function (id) {
    return clientMap.get(id)
  },
  updateClient: function (id) {
    write(id, clientMap.get(id))
  },
  getGuildInfo: function (id) {
    return clientMap.get(id).guildInfo
  },
  getGameRolesInfo: function (id) {
    return clientMap.get(id).gameRolesInfo
  },
  getPlayerInfo: function (id) {
    return clientMap.get(id).playerInfo
  },
  checkChannels: function (guild, channelId) {
    let id = guild.id
    let guildInfo = clientMap.get(id).guildInfo
    let textId = guildInfo.text.id
    let voiceId = guildInfo.voice.id

    if (!channelId || channelId === textId || channelId === voiceId) {
      if (!textId ||
      (textId && !func.can(['sendMessages', 'readMessages'], guild.channels.get(textId)))) {
        // cannot use current default text channel
        guildInfo.text = func.findChannel('text', id)
      } else if (!voiceId ||
      (voiceId && !func.can(['voiceSpeak', 'voiceConnect'], guild.channels.get(voiceId)))) {
        // cannot use current default voice channel
        guildInfo.voice = func.findChannel('voice', id)
      } else {
        return
      }
      func.dmWarn(id, guildInfo.text, guildInfo.voice)
    }
  }
}

function add (guild) {
  let tmp = {}
  tmp.guild = { id: guild.id, name: guild.name }
  tmp.text = func.findChannel('text', guild.id)
  tmp.voice = func.findChannel('voice', guild.id)

  if (tmp.voice) {
    guild.channels.get(tmp.voice.id).join()
    .then(() => { require('./music.js').checkPlayer(guild, true) })
  }
  if (!tmp.text || !tmp.voice) {
    func.dmWarn(guild, tmp.text, tmp.voice)
  }
  let client = new Client(tmp.guild, tmp.text, tmp.voice)
  clientMap.set(guild.id, client)
  write(guild.id, client)
}

async function write (id, client) {
  fs.writeFile(file(id), JSON.stringify(client, null, 2), (e) => {
    if (e) {
      throw e
    }
  })
}

async function remove (id) {
  // remove player map entry
  clientMap.delete(id)
  fs.unlink(file(id), (e) => {
    if (e) {
      throw e
    }
  })
}

function file (id) {
  return `${data}${id}.json`
}
