const ytdl = require('youtube-dl')
const ytpl = require('ytpl')
const ytsr = require('ytsr')
const fs = require('fs')
const seedrandom = require('seedrandom')
const rng = seedrandom()
const func = require('./common.js')
const main = require('../TuxedoMan.js')
const config = require('../config.json')
const db = require('./database.js')
const Response = require('./response.js')

module.exports = {
  autoQueue: function (client) {
    // get a random video
    const playlists = config.playlists
    const files = fs.readdirSync(playlists)
    if (files.length === 0) {
      client.autoplay = false
      return func.log('no playlists', 'yellow')
    }

    let tmp = fs.readFileSync(`${playlists}/${files[Math.floor((rng() * files.length))]}`, 'utf-8')
    let autoplaylist = tmp.split('\n')
    let video = autoplaylist[Math.floor(rng() * autoplaylist.length)]
    ytdl.getInfo(video, [], { maxBuffer: Infinity }, (error, info) => {
      if (error) {
        func.log(null, 'red', `${video} ${error}`)
        module.exports.autoQueue(client)
      } else {
        client.queue.push({ title: info.title, link: video, user: main.bot().User })
        playNextSong(client, null)
      }
    })
  },
  addToQueue: function (video, msg, mute = false, done = false) {
    ytdl.getInfo(video, [], {maxBuffer: Infinity}, (error, info) => {
      let str = ''
      let client = db.getGuildInfo(msg.guild.id)

      if (done) {
        str = 'Playlist is queued.'
      } else if (error) {
        func.log(null, 'red', `${video}: ${error}`)
        str = `The requested video (${video}) does not exist or cannot be played.`
      } else {
        client.queue.push({ title: info.title, link: video, user: msg.member })

        if (!mute) {
          str = `"${info.title}" has been added to the queue.`
        }

        if (!client.isPlaying && client.queue.length === 1) {
          client.paused = false
          playNextSong(client)
        }
      }
      func.messageHandler(new Response(msg, str), client)
    })
  },
  volume: function (client, vol) {
    client.volume = vol

    if (client.isPlaying) {
      client.encoder.voiceConnection.getEncoder().setVolume(vol)
    }
    db.updateGuilds(client)
  },
  searchVideo: function (msg, query) {
    ytsr.search(query, { limit: 1 }, function (err, data) {
      if (err) { throw err }

      if (data.items[0].type === 'playlist') {
        return module.exports.queuePlaylist(data.items[0].link, msg)
      } else if (data.items[0].type === 'video') {
        return module.exports.addToQueue(data.items[0].link, msg)
      }
    })
  },
  queuePlaylist: function (playlistId, msg) {
    let done = false

    ytpl(playlistId, (err, playlist) => {
      if (err) { throw err }

      for (let i = 0; i < playlist.items.length; i++) {
        if (i === playlist.items.length - 1) {
          done = true
        }
        module.exports.addToQueue(playlist.items[i].url_simple, msg, true, done)
      }

      let str = `${playlist.title} is being queued.`
      return func.messageHandler(new Response(msg, str), db.getGuildInfo(msg.guild.id))
    })
  }
}

function playNextSong (client, msg) {
  let str = ''

  if (client.queue.length === 0) {
    if (client.autoplay) {
      return module.exports.autoQueue(client)
    } else if (msg) {
      str = 'Nothing in the queue!'
    }
  } else {
    const bot = main.bot()
    client.isPlaying = true

    let title = client.queue[0].title
    let user = client.queue[0].user
    client.nowPlaying = { title: title, user: user }

    const mp3 = `${config.data}${client.guild.id}.mp3`

    let videoLink = client.queue[0].link
    let video = ytdl(videoLink, ['--format=bestaudio/worstaudio', '--no-playlist'], {maxBuffer: Infinity})
    video.pipe(fs.createWriteStream(mp3))

    video.once('end', () => {
      if ((client.informNowPlaying && client.informAutoPlaying) ||
      (client.informNowPlaying && user.id !== bot.User.id)) {
        str = `Now playing: "${title}" (requested by ${user.username})`
      }

      let info = bot.VoiceConnections.getForGuild(client.guild.id)
      client.encoder = info.voiceConnection
      .createExternalEncoder({
        type: 'ffmpeg',
        source: mp3,
        format: 'pcm'
      })

      client.encoder.play()
      client.encoder.voiceConnection.getEncoder().setVolume(client.volume)

      if (client.encoder.voiceConnection.channel.members.length === 1) {
        client.paused = true
        client.encoder.voiceConnection.getEncoderStream().cork()
      }

      client.encoder.once('end', () => {
        client.isPlaying = false
        if (!client.paused && client.queue.length !== 0) {
          playNextSong(client, null)
        } else if (!client.paused && client.autoplay) {
          module.exports.autoQueue(client)
        }
      })
    })
    client.queue.splice(0, 1)
  }
  func.messageHandler(new Response(msg, str), client)
}
