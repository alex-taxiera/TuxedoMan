const ytdl = require("youtube-dl");
const ytpl = require("ytpl");
const ytsr = require("ytsr");
const fs = require("fs");
const seedrandom = require("seedrandom");
const rng = seedrandom();

var func = require("./common.js");

module.exports =
{
    auto_queue : function(client)
    {
        // get a random video
        var files = fs.readdirSync(global.playlist);
        if (files.length === 0)
        {
            client.autoplay = false;
            return console.log("BZZT NO PLAYLISTS IN PLAYLIST FOLDER");
        }
        var tmp = fs.readFileSync(`${global.playlist}/${files[Math.floor((rng() * files.length))]}`, "utf-8");
        var autoplaylist = tmp.split("\n");
        var video = autoplaylist[Math.floor(rng() * autoplaylist.length)];

        ytdl.getInfo(video, [], {maxBuffer: Infinity}, (error, info) =>
        {
            if (error)
            {
                console.log(`ERROR: ${video} ${error}`);
                module.exports.auto_queue(client);
            }
            else
            {
                console.log(`BZZT AUTO QUEUE ON ${client.server.name.toUpperCase()} BZZT`);
                client.queue.push({title: info.title, url: video, user: global.bot.User});
                play_next_song(client, null);
            }
        });
    },
    add_to_queue : function(video, msg, mute = false, done = false)
    {
        ytdl.getInfo(video, [], {maxBuffer: Infinity}, (error, info) =>
        {
            var str = "";
            if (done)
            {
                str = "Playlist is queued.";
                func.message_handler({promise: msg.reply(str), content: str}, func.get_client(msg.guild.id));
            }
            if (error)
            {
                console.log(`Error (${video}): ${error}`);
                str = `The requested video (${video}) does not exist or cannot be played.`;
                func.message_handler({promise: msg.reply(str), content: str}, client);
            }
            else
            {
                var client = func.get_client(msg.guild.id);
                client.queue.push({title: info.title, url: video, user: msg.member});

                if (!mute)
                {
                    str = `\"${info.title}" has been added to the queue.`;
                    func.message_handler({promise: msg.reply(str), content: str}, client);
                }
                if (!client.is_playing && client.queue.length === 1)
                {
                    client.paused = false;
                    return play_next_song(client);
                }
            }
        });
    },
    volume : function(client, vol)
    {
        client.volume = vol;
        if (client.is_playing)
        {
            client.encoder.voiceConnection.getEncoder().setVolume(vol);
        }
        func.write_changes();
    },
    search_video : function(msg, query)
    {
        ytsr.search(query, {limit: 1}, function(err, data)
        {
            if(err) throw err;
            if (data.items[0].type === "playlist")
            {
                return module.exports.queue_playlist(data.items[0].link, msg);
            }
            else if (data.items[0].type === "video")
            {
                return module.exports.add_to_queue(data.items[0].link, msg);
            }
        });
    },
    queue_playlist : function(playlistId, msg)
    {
        var str = "";
        var done = false;
        ytpl(playlistId, function(err, playlist)
        {
            if (err) throw err;
            for (var i = 0; i < playlist.items.length; i++)
            {
                if (i === playlist.items.length - 1)
                {
                    done = true;
                }
                module.exports.add_to_queue(playlist.items[i].url_simple, msg, true, done);
            }
            str = `${playlist.title} is being queued.`;
            return func.message_handler({promise: msg.reply(str), content: str}, func.get_client(msg.guild.id));
        });
    },
};

function play_next_song(client, msg)
{
    if (client.queue.length === 0)
    {
        if (client.autoplay)
        {
            return module.exports.auto_queue(client);
        }
        else if (msg)
        {
            return msg.reply("Nothing in the queue!").then((m) =>
            {
                setTimeout(function(){m.delete();}, 25000);
            });
        }
    }
    client.is_playing = true;
    var video_url = client.queue[0].url;
    var title = client.queue[0].title;
    var user = client.queue[0].user;

    client.now_playing = {title: title, user: user};

    var video = ytdl(video_url,["--format=bestaudio/worstaudio", "--no-playlist"], {maxBuffer: Infinity});
    video.pipe(fs.createWriteStream(`./data/${client.server.id}.mp3`));
    video.once("end", () =>
    {
        if (client.inform_np && client.announce_auto || client.inform_np && user.id !== global.bot.User.id)
        {
            var tc = func.get_tc(client);
            if (tc)
            {
                tc.sendMessage(`Now playing: "${title}" (requested by ${user.username})`).then((m) =>
                {
                    setTimeout(function(){m.delete();}, 25000);
                });
            }
        }

        var info = global.bot.VoiceConnections.getForGuild(client.server.id);
        client.encoder = info.voiceConnection.createExternalEncoder({
            type: "ffmpeg",
            source: `./data/${client.server.id}.mp3`,
            format: "pcm"
        });

        console.log(`BZZT SONG START ON ${client.server.name.toUpperCase()} BZZT`);
        client.encoder.play();
        client.encoder.voiceConnection.getEncoder().setVolume(client.volume);

        if (client.encoder.voiceConnection.channel.members.length === 1)
        {
            client.paused = true;
            client.encoder.voiceConnection.getEncoderStream().cork();
        }

        client.encoder.once("end", () =>
        {
            client.is_playing = false;
            if(!client.paused && client.queue.length !== 0)
            {
                console.log(`BZZT NEXT IN QUEUE ON ${client.server.name.toUpperCase()} BZZT`);
                play_next_song(client, null);
            }
            else if (!client.paused && client.autoplay)
            {
                module.exports.auto_queue(client);
            }
        });
    });
    client.queue.splice(0,1);
}
