const Discordie = require("discordie");
const ytdl = require("youtube-dl");
const fs = require("fs");
const seedrandom = require("seedrandom");
const request = require("request");

const yt_api_key = "AIzaSyDfos2RYQBFyr_KZlIdXkmJJ2jN8327XV0";
const token = fs.readFileSync("data\\token.txt", "utf-8");
const serverdata = "data\\servers.json";
var files = fs.readdirSync("playlist");
const rng = seedrandom();
var s; //s = servers (list of servers with all info)

var bot = new Discordie();
function start()
{
    bot.connect({token: token});
}

function _can(permissions, context)
{
    for (var i = 0; i < permissions.length; i++)
    {
        if (context === undefined)
        {
            return false;
        }
        var perm = bot.User.permissionsFor(context);
        var p;
        if (context.isGuildText)
        {
            var text = perm.Text;
            for (p in text)
            {
                if (!text.hasOwnProperty(p))
                {
                    continue;
                }
                if (p === permissions[i])
                {
                    if(!text[p])
                    {
                        return false;
                    }
                }
            }
        }
        else if (context.isGuildVoice)
        {
            var voice = perm.Voice;
            for (p in voice)
            {
                if (!voice.hasOwnProperty(p))
                {
                    continue;
                }
                if (p === permissions[i])
                {
                    if(!voice[p])
                    {
                        return false;
                    }
                }
            }
        }
        else
        {
            return false;
        }
    }
    return true;
}

start();

bot.Dispatcher.on("DISCONNECTED", e =>
{
    console.log(e.error);
    start();
});

bot.Dispatcher.on("VOICE_CHANNEL_LEAVE", e =>
{
    var client = get_client(e);
    if (e.user.id === bot.User.id)
    {
        console.log(`BZZT LEFT CHANNEL ${e.channel.name.toUpperCase()} BZZT`);
        if (e.newChannelId === null)
        {
            var vc = bot.Channels.find(c => c.id == e.channelId);
            vc.join(vc).catch((e) => {console.log(e);});
        }
    }
    else if (client.is_playing && client.encoder.voiceConnection.channel.members.length === 1 && !client.paused)
    {
        client.paused = true;
        client.encoder.voiceConnection.getEncoderStream().cork();
    }
});

bot.Dispatcher.on("VOICE_CHANNEL_JOIN", e =>
{
    var client = get_client(e);
    if (client.is_playing && client.encoder.voiceConnection.channel.members.length === 1 && !client.paused)
    {
        client.paused = true;
        client.encoder.voiceConnection.getEncoderStream().cork();
    }
});

bot.Dispatcher.on("GUILD_CREATE", e =>
{
    var servers = [];
    servers.push(e.guild);
    console.log(`BZZT JOINED ${e.guild.name} GUILD BZZT`);
    sweep_clients_and_init(servers);
});

bot.Dispatcher.on("GUILD_DELETE", e =>
{
    var index = s.findIndex(s => s.server.id === e.guildId);
    var client = get_client(e);
    console.log(`BZZT LEFT ${client.server.name} GUILD BZZT`);
    client.paused = true;
    if (client.is_playing)
    {
        client.encoder.destroy();
    }
    s.splice(index, 1);
    write_changes();
});

bot.Dispatcher.on("GATEWAY_READY", () =>
{
    s = [];
    console.log("BZZT ONLINE BZZT");
    bot.User.setGame("BZZT KILLING BZZT");
    fs.stat(serverdata, function(err)
    {
        var servers = bot.Guilds.toArray();
        if(!err)
        {
            var tmp;
            var old_servers = JSON.parse(fs.readFileSync(serverdata, "utf-8"));
            if (old_servers.length === 0)
            {
                console.log("BZZT EMPTY SERVER FILE BZZT");
                return sweep_clients_and_init(servers);
            }
            for (var i = 0; i < servers.length; i++)
            {
                var j;
                tmp = undefined;
                for (j = 0; j < old_servers.length; j++)
                {
                    if (servers[i].id === old_servers[j].server.id)
                    {
                        tmp = {};
                        tmp.server = servers[i];
                    }
                    if (tmp !== undefined)
                    {
                        var k;
                        var old_tc = bot.Channels.textForGuild(tmp.server.id)
                        .find(c => c.id == old_servers[j].tc.id);
                        if (_can(["SEND_MESSAGES"], old_tc))
                        {
                            tmp.tc = old_tc;
                        }
                        if (tmp.tc === undefined)
                        {
                            var tc = bot.Channels.textForGuild(tmp.server.id);
                            for (k = 0; k < tc.length; k++)
                            {
                                if (_can(["SEND_MESSAGES"], tc[k]))
                                {
                                    tmp.tc = tc[k];
                                    break;
                                }
                            }
                        }

                        var old_vc = bot.Channels.voiceForGuild(tmp.server.id)
                        .find(c => c.id == old_servers[j].vc.id);
                        if (_can(["SPEAK", "CONNECT"], old_vc))
                        {
                            old_vc.join();
                            tmp.vc = old_vc;
                        }
                        if (tmp.vc === undefined)
                        {
                            var vc = bot.Channels.voiceForGuild(tmp.server.id);
                            for (k = 0; k < vc.length; k++)
                            {
                                if (_can(["SPEAK", "CONNECT"], vc[k]))
                                {
                                    vc[k].join();
                                    tmp.vc = vc[k];
                                    break;
                                }
                            }
                        }
                        s.push({
                            server:         {id: tmp.server.id,
                                            name: tmp.server.name},
                            tc:             {id: tmp.tc.id,
                                            name: tmp.tc.name},
                            vc:             {id: tmp.vc.id,
                                            name: tmp.vc.name},
                            vip:            old_servers[j].vip,
                            queue:          [],
                            now_playing:    {},
                            is_playing:     false,
                            paused:         false,
                            autoplay:       old_servers[j].autoplay,
                            inform_np:      old_servers[j].inform_np,
                            announce_auto:  old_servers[j].announce_auto,
                            encoder:        {},
                            volume:         old_servers[j].volume,
                            meme:           old_servers[j].meme,
                            swamp:          true,
                            lmao_count:     0
                        });
                        break;
                    }
                }
            }
            sweep_clients_and_init(servers);
        }
        else
        {
            console.log("BZZT NO SERVER FILE BZZT");
            sweep_clients_and_init(servers);
        }
    });
});

bot.Dispatcher.on("MESSAGE_CREATE", e =>
{
    var msg = e.message;
    var text = msg.content;
    if (msg.author.id !== bot.User.id)
    {
        if (text[0] == "*")
        {
            if (handle_command(msg, text.substring(1), false))
            {
                if (_can(["MANAGE_MESSAGES"], msg.channel))
                {
                    setTimeout(function(){msg.delete();}, 5000);
                }
            }
        }
        else if (get_client(msg).meme)
        {
            if (_can(["SEND_MESSAGES"], msg.channel))
            {
                handle_command(msg, text, true);
            }
        }
    }
});

function sweep_clients_and_init(servers)
{
    var i;
    var j;
    for (i = 0; i < servers.length; i++)
    {
        var already_exists = s.find(s => s.server.id === servers[i].id);
        if (already_exists === undefined)
        {
            var tmp = {};
            tmp.server = servers[i];

            var tc = bot.Channels.textForGuild(tmp.server.id);
            for (j = 0; j < tc.length; j++)
            {
                if (_can(["SEND_MESSAGES"], tc[j]))
                {
                    tmp.tc = tc[j];
                    break;
                }
            }
            var vc = bot.Channels.voiceForGuild(tmp.server.id);
            for (j = 0; j < vc.length; j++)
            {
                if (_can(["SPEAK", "CONNECT"], vc[j]))
                {
                    vc[j].join();
                    tmp.vc = vc[j];
                    break;
                }
            }
            s.push({
                server:         {id: tmp.server.id,
                                name: tmp.server.name},
                tc:             {id: tmp.tc.id,
                                name: tmp.tc.name},
                vc:             {id: tmp.vc.id,
                                name: tmp.vc.name},
                vip:            null,
                queue:          [],
                now_playing:    {},
                is_playing:     false,
                paused:         false,
                autoplay:       true,
                inform_np:      true,
                announce_auto:  true,
                encoder:        {},
                volume:         10,
                meme:           true,
                swamp:          true,
                lmao_count:     0
            });
        }
    }
    setTimeout(function()
    {
        for (i = 0; i < servers.length; i++)
        {
            for (j = 0; j < s.length; j++)
            {
                if (servers[i].id === s[j].server.id && s[j].autoplay && bot.User.getVoiceChannel(s[j].server.id).members.length !== 1)
                {
                    auto_queue(s[j]);
                }
            }
        }
    }, 2000);
    write_changes();
}

function write_changes()
{
    var tmp = [];
    for (var i = 0; i < s.length; i++)
    {
        tmp.push({
            server:         s[i].server,
            tc:             s[i].tc,
            vc:             s[i].vc,
            vip:            s[i].vip,
            autoplay:       s[i].autoplay,
            inform_np:      s[i].inform_np,
            announce_auto:  s[i].announce_auto,
            meme:           s[i].meme,
            volume:         s[i].volume
        });
    }
    fs.writeFileSync(serverdata, JSON.stringify(tmp, null, 2), "utf-8");
    console.log("BZZT WROTE TO FILE BZZT");
}

function get_client(e)
{
    var i;
    if (e.guildId)
    {
        for (i = 0; i < s.length; i++)
        {
            if (s[i].server.id === e.guildId)
            {
                return s[i];
            }
        }
    }
    else if (e.guild.id)
    {
        for (i = 0; i < s.length; i++)
        {
            if (s[i].server.id === e.guild.id)
            {
                return s[i];
            }
        }
    }
}

function auto_queue(client)
{
    // get a random video
    var autoplaylist = JSON.parse(fs.readFileSync(`playlist\\${files[Math.floor((rng() * files.length))]}`, "utf-8"));
    var video = autoplaylist[Math.floor(rng() * autoplaylist.length)].link;

    ytdl.getInfo(video, [], {maxBuffer: Infinity}, (error, info) =>
    {
        if (error)
        {
            console.log(`ERROR: ${video} ${error}`);
            auto_queue(client);
        }
        else
        {
            console.log(`BZZT AUTO QUEUE ON ${client.server.name.toUpperCase()} BZZT`);
            client.queue.push({title: info.title, url: video, user: bot.User});
            play_next_song(client, null);
        }
    });
}

function message_handler(message, client)
{
    if (message !== undefined)
    {
        message.promise.then((m) =>
        {
            setTimeout(function(){m.delete();}, 10000);
        })
        .catch(() =>
        {
            var tc = get_tc(client);
            if (tc !== undefined)
            {
                tc.sendMessage(message.content)
                .then((m) =>
                {
                    setTimeout(function(){m.delete();}, 10000);
                });
            }
        });
    }
}

function add_to_queue(video, msg, mute = false)
{
    ytdl.getInfo(video, [], {maxBuffer: Infinity}, (error, info) =>
    {
        var str = "";
        if (error)
        {
            console.log(`Error (${video}): ${error}`);
            str = `The requested video (${video}) does not exist or cannot be played.`;
            message_handler({promise: msg.reply(str), content: str}, client);
        }
        else
        {
            var client = get_client(msg);
            client.queue.push({title: info.title, url: video, user: msg.author});

            if (!mute)
            {
                str = `\"${info.title}" has been added to the queue.`;
                message_handler({promise: msg.reply(str), content: str}, client);
            }
            if (!client.is_playing && client.queue.length === 1)
            {
                client.paused = false;
                return play_next_song(client);
            }
        }
    });
}

function volume(client, vol)
{
    client.volume = vol;
    if (client.is_playing)
    {
        client.encoder.voiceConnection.getEncoder().setVolume(vol);
    }
    write_changes();
}

function get_tc(client)
{
    var text = bot.Channels.textForGuild(client.server.id).find(c => c.id == client.tc.id);
    if (text === undefined || !_can(["SEND_MESSAGES"], text))
    {
        var tc = bot.Channels.textForGuild(client.server.id);
        for (var i = 0; i < tc.length; i++)
        {
            if (_can(["SEND_MESSAGES"], tc[i]))
            {
                text = client.tc = tc[i];
                return text;
            }
        }
        return undefined;
    }
    else
    {
        return text;
    }
}

function play_next_song(client, msg)
{
    if (client.queue.length === 0)
    {
        if (client.autoplay)
        {
            return auto_queue(client);
        }
        else if (msg !== null)
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
    video.pipe(fs.createWriteStream(`data\\${client.server.id}.mp3`));
    video.once("end", () =>
    {
        if (client.inform_np && client.announce_auto || client.inform_np && user.id !== bot.User.id)
        {
            var tc = get_tc(client);
            if (tc !== undefined)
            {
                tc.sendMessage(`Now playing: "${title}" (requested by ${user.username})`).then((m) =>
                {
                    setTimeout(function(){m.delete();}, 25000);
                });
            }
        }

        var info = bot.VoiceConnections.getForGuild(client.server.id);
        client.encoder = info.voiceConnection.createExternalEncoder({
            type: "ffmpeg",
            source: `data\\${client.server.id}.mp3`,
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
                auto_queue(client);
            }
        });
    });
    client.queue.splice(0,1);
}

function search_command(command_name)
{
    for (var i = 0; i < commands.length; i++)
    {
        if (commands[i].command == command_name.toLowerCase())
        {
            return commands[i];
        }
    }
    return false;
}

function handle_command(msg, text, meme)
{
    var command = "";
    if (!meme)
    {
        var client = get_client(msg);
        var params = text.split(" ");
        command = search_command(params[0]);

        if(command)
        {
            if (params.length - 1 < command.parameters.length)
            {
                return msg.reply("Insufficient parameters!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 10000);
                });
            }
            else
            {
                if (rank(msg) >= command.rank)
                {
                    message_handler(command.execute(msg, params), client);
                }
                else if (rank(msg) < command.rank)
                {
                    message_handler(deny_rank(msg, command.rank));
                }
                return true;
            }
        }
    }
    else
    {
        command = search_command("memes");
        return command.execute(msg, text);
    }
}

function search_video(msg, query)
{
    request(`https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=${encodeURIComponent(query)}&key=${yt_api_key}`, (error, response, body) =>
    {
        var json = JSON.parse(body);
        var str = "";
        if ("error" in json)
        {
            str = `An error has occurred: ${json.error.errors[0].e} - ${json.error.errors[0].reason}`;
            return message_handler({promise: msg.reply(str), content: str}, get_client(msg));
        }
        else if (json.items.length === 0)
        {
            str = "No videos found matching the search criteria.";
            return message_handler({promise: msg.reply(str), content: str}, get_client(msg));
        }
        else
        {
            return add_to_queue(json.items[0].id.videoId, msg);
        }
    });
}

function queue_playlist(playlistId, msg, pageToken = "")
{
    var str = "";
    request(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${yt_api_key}&pageToken=${pageToken}`, (error, response, body) =>
    {
        var json = JSON.parse(body);
        if ("error" in json)
        {
            str = `An error has occurred: ${json.error.errors[0].e} - ${json.error.errors[0].reason}`;
            return message_handler({promise: msg.reply(str), content: str}, get_client(msg));
        }
        else if (json.items.length === 0)
        {
            str = "No videos found within playlist.";
            return message_handler({promise: msg.reply(str), content: str}, get_client(msg));
        }
        else
        {
            console.log(`BZZT QUEUE PLAYLIST ON ${get_client(msg).server.name.toUpperCase()} BZZT`);
            for (var i = 0; i < json.items.length; i++)
            {
                add_to_queue(json.items[i].snippet.resourceId.videoId, msg, true);
            }
            if (json.nextPageToken == null)
            {
                request(`https://www.googleapis.com/youtube/v3/playlists?part=snippet%2Clocalizations&id=${playlistId}&fields=items(localizations%2Csnippet%2Flocalized%2Ftitle)&key=${yt_api_key}`, (e, r, body) =>
                {
                    var json = JSON.parse(body);
                    str = `${json.items[0].snippet.localized.title} has been queued.`;
                    return message_handler({promise: msg.reply(str), content: str}, get_client(msg));
                });
            }
            return queue_playlist(playlistId, msg, json.nextPageToken);
        }
    });
}

function deny_rank(msg, rank)
{
    var str = "";
    if (rank === 2)
    {
        str = "Must be VIP!";
        return {promise: msg.reply(str), content: str};
    }
    else if (rank === 3)
    {
        str = "Must be server owner!";
        return {promise: msg.reply(str), content: str};
    }
}

function rank(msg)
{
    var client = get_client(msg);
    if (msg.guild.isOwner(msg.author))
    {
        return 3;
    }
    else if (client.vip !== null && msg.member.hasRole(client.vip))
    {
        return 2;
    }
    else
    {
        return 1;
    }
}

var commands =
[
    // volume
    {
        command: "volume",
        description: "Set music volume.",
        parameters: ["number (1-200)"],
        rank: 1,
        execute: function(msg, params)
        {
            var str = "";
            if (params[1] > 0 && params[1] < 201)
            {
                volume(get_client(msg), params[1]/2);
                str = "Volume set!";
                return {promise: msg.reply(str), content: str};
            }
            else
            {
                str = "Invalid volume level!";
                return {promise: msg.reply(str), content: str};
            }
        }
    },
    // play
    {
        command: "play",
        description: "Resumes paused/stopped playback",
        parameters: [],
        rank: 1,
        execute: function(msg)
        {
            var client = get_client(msg);
            var str = "";
            if (!client.is_playing && client.queue.length === 0)
            {
                if (client.autoplay)
                {
                    client.paused = false;
                    return auto_queue(client);
                }
                else
                {
                    str = "Turn autoplay on, or use search or request to pick a song!";
                    return {promise: msg.reply(str), content: str};
                }
            }
            else if (client.paused)
            {
                client.paused = false;
                if (client.is_playing)
                {
                    client.encoder.voiceConnection.getEncoderStream().uncork();
                }
                str = "Resuming!";
                return {promise: msg.reply(str), content: str};
            }
            else
            {
                str = "Playback is already running";
                return {promise: msg.reply(str), content: str};
            }
        }
    },
    // pause
    {
        command: "pause",
        description: "Pauses your shit",
        parameters: [],
        rank: 1,
        execute: function(msg)
        {
            var client = get_client(msg);
            var str = "";
            if (client.paused)
            {
                str = "Playback is already paused!";
                return {promise: msg.reply(str), content: str};
            }
            else
            {
                client.paused = true;
                if (client.is_playing)
                {
                    client.encoder.voiceConnection.getEncoderStream().cork();
                }
                str = "Pausing!";
                return {promise: msg.reply(str), content: str};
            }
        }
    },
    // stop
    {
        command: "stop",
        description: "Delete current song and prevent further playback",
        parameters: [],
        rank: 1,
        execute: function(msg)
        {
            var client = get_client(msg);
            var str = "";
            if (client.is_playing)
            {
                client.paused = true;
                client.encoder.destroy();
                client.now_playing = {};
                str = "Stopping...";
                return {promise: msg.reply(str), content: str};
            }
            else
            {
                str = "Bot is not playing anything!";
                return {promise: msg.reply(str), content: str};
            }
        }
    },
    // skip
    {
        command: "skip",
        description: "Skips the current song",
        parameters: [],
        rank: 1,
        execute: function(msg)
        {
            var client = get_client(msg);
            var str = "";
            if(client.is_playing)
            {
                client.encoder.destroy();
                str = "Skipping...";
                return {promise: msg.reply(str), content: str};
            }
            else
            {
                str = "There is nothing being played.";
                return {promise: msg.reply(str), content: str};
            }
        }
    },
    // request
    {
        command: "request",
        description: "Adds the requested video to the playlist queue",
        parameters: ["video URL, video ID, playlist URL or alias"],
        rank: 1,
        execute: function(msg, params)
        {
            var regExp = /^.*(youtu.be\/|list=)([^#\&\?]*).*/;
            var match = params[1].match(regExp);

            if (match && match[2]){
                return queue_playlist(match[2], msg);
            }
            else
            {
                console.log(`BZZT REQUEST VIDEO ON ${get_client(msg).server.name.toUpperCase()} BZZT`);
                return add_to_queue(params[1], msg);
            }
        }
    },
    // search
    {
        command: "search",
        description: "Searches for a video on YouTube and adds it to the queue",
        parameters: ["query"],
        rank: 1,
        execute: function(msg, params)
        {
            var str = "You need a YouTube API key in order to use the !search command. Please see https://github.com/agubelu/discord-music-bot#obtaining-a-youtube-api-key";
            if (yt_api_key === null)
            {
                return {promise: msg.reply(str), content: str};
            }
            else
            {
                var q = "";
                for (var i = 1; i < params.length; i++)
                {
                    q += params[i] + " ";
                }
                console.log(`BZZT SEARCH VIDEO ON ${get_client(msg).server.name.toUpperCase()} BZZT`);
                return search_video(msg, q);
            }
        }
    },
    // np
    {
        command: "np",
        description: "Displays the current song",
        parameters: [],
        rank: 1,
        execute: function(msg)
        {
            var client = get_client(msg);
            var str = "Now playing: ";
            if(client.is_playing)
            {
                str += `"${client.now_playing.title}" (requested by ${client.now_playing.user.username})`;
            }
            else
            {
                str += "nothing!";
            }
            return {promise: msg.reply(str), content: str};
        }
    },
    // queue
    {
        command: "queue",
        description: "Displays the queue",
        parameters: [],
        rank: 1,
        execute: function(msg) {
            var client = get_client(msg);
            var str = "";
            if(client.queue.length === 0)
            {
                str = "the queue is empty.";
            }
            else
            {
                var long_queue = client.queue.length > 30;
                for (var i = 0; i < (long_queue ? 30 : client.queue.length); i++)
                {
                    str += `"${client.queue[i].title}" (requested by ${client.queue[i].user.username})`;
                }
                if (long_queue)
                {
                    str += `\n**...and ${(client.queue.length - 30)} more.**`;
                }
            }
            return {promise: msg.reply(str), content: str};
        }
    },
    // commands
    {
        command: "commands",
        description: "Displays this message, duh!",
        parameters: [],
        rank: 1,
        execute: function(msg)
        {
            var str = "Available commands:";
            for (var i = 0; i < commands.length; i++)
            {
                var c = commands[i];
                var rank = "";
                if (c.rank === 2)
                {
                    rank = "VIP";
                }
                else if (c.rank === 3)
                {
                    rank = "Owner";
                }
                else
                {
                    rank = "Anyone";
                }
                str += `\n* ${c.command} (${rank})`;
                for (var j = 0; j < c.parameters.length; j++)
                {
                    str += ` <${c.parameters[j]}>`;
                }
                str += `: ${c.description}`;
            }
            msg.author.openDM()
            .then(dm =>
            {
                dm.sendMessage(str);
            });
            return;
        }
    },
    // clearqueue
    {
        command: "clearqueue",
        description: "Removes all songs from the queue",
        parameters: [],
        rank: 2,
        execute: function(msg)
        {
            var client = get_client(msg);
            var str = "";
            client.queue = [];
            str = "Queue has been cleared!";
            return {promise: msg.reply(str), content: str};
        }
    },
    // remove
    {
        command: "remove",
        description: "Removes a song from the queue",
        parameters: ["Request index or 'last'"],
        rank: 2,
        execute: function(msg, params)
        {
            var index = params[1];
            var client = get_client(msg);
            var str = "";
            if (client.queue.length === 0)
            {
                str = "The queue is empty";
                return {promise: msg.reply(str), content: str};

            }
            else if (isNaN(index) && index !== "last")
            {
                str = `Argument "${index}" is not a valid index.`;
                return {promise: msg.reply(str), content: str};
            }

            if (index === "last") {index = client.queue.length;}
            index = parseInt(index);
            if (index < 1 || index > client.queue.length)
            {
                str = `Cannot remove request #${index} from the queue (there are only ${client.queue.length} requests currently)`;
                return {promise: msg.reply(str), content: str};
            }

            var deleted = client.queue.splice(index - 1, 1);
            str = `Request "${deleted[0].title}" was removed from the queue.`;
            return {promise: msg.reply(str), content: str};
        }
    },
    // toggle np
    {
        command: "nptoggle",
        description: "Toggle announcing when a song starts playing",
        parameters: [],
        rank: 2,
        execute: function(msg)
        {
            var client = get_client(msg);
            var str = "";
            client.inform_np = !client.inform_np;
            write_changes();
            str = `Now Playing announcements set to ${client.inform_np}!`;
            return {promise: msg.reply(str), content: str};
        }
    },
    // toggle auto np
    {
        command: "autonptoggle",
        description: "Toggle announcing when an autoplay song starts playing",
        parameters: [],
        rank: 2,
        execute: function(msg)
        {
            var client = get_client(msg);
            var str = "";
            client.announce_auto = !client.announce_auto;
            write_changes();
            str = `Now Playing (autoplay) announcements set to ${client.announce_auto}!`;
            return {promise: msg.reply(str), content: str};
        }
    },
    // toggle autoplay
    {
        command: "autotoggle",
        description: "Toggle music autoplay",
        parameters: [],
        rank: 2,
        execute: function(msg)
        {
            var client = get_client(msg);
            var str = "";
            client.autoplay = !client.autoplay;
            if (client.autoplay && bot.User.getVoiceChannel(msg.guild).members.length !== 1)
            {
                client.paused = false;
                auto_queue(client);
            }
            write_changes();
            str = `Autoplay set to ${client.autoplay}!`;
            return {promise: msg.reply(str), content: str};
        }
    },
    // toggle meme
    {
        command: "memetoggle",
        description: "Toggle meme posting",
        parameters: [],
        rank: 2,
        execute: function(msg)
        {
            var client = get_client(msg);
            var str = "";
            client.meme = !client.meme;
            write_changes();
            str = `Meme posting set to ${client.meme}!`;
            return {promise: msg.reply(str), content: str};
        }
    },
    // setvoice
    {
        command: "voice",
        description: "Set voice channel to start up in.",
        parameters: ["voice channel name"],
        rank: 2,
        execute: function(msg, params)
        {
            var client = get_client(msg);
            var str = "";
            var vc = bot.Channels.voiceForGuild(msg.guild);
            for (var j = 0; j < vc.length; j++)
            {
                if (params[1] === vc[j].name)
                {
                    if (client.vc.id !== vc[j].id)
                    {
                        if (_can(["CONNECT"], vc[j]))
                        {
                            if (_can(["SPEAK"], vc[j]))
                            {
                                client.vc = {id: vc[j].id, name: vc[j].name};
                                write_changes();
                                vc[j].join();
                                str = "Default set!";
                                return {promise: msg.reply(str), content: str};
                            }
                            else
                            {
                                str = "Cannot speak in that channel!";
                                return {promise: msg.reply(str), content: str};
                            }
                        }
                        else
                        {
                            str = "Cannot connect to that channel!";
                            return {promise: msg.reply(str), content: str};
                        }
                    }
                    else
                    {
                        str = "Already default channel!";
                        return {promise: msg.reply(str), content: str};
                    }
                }
            }
            str = `Could not find ${params[1]} channel!`;
            return {promise: msg.reply(str), content: str};
        }
    },
    // settext
    {
        command: "text",
        description: "Set text channel to announce things in.",
        parameters: ["text channel name"],
        rank: 2,
        execute: function(msg, params)
        {
            var client = get_client(msg);
            var str = "";

            var tc = bot.Channels.textForGuild(msg.guild);
            for (var j = 0; j < tc.length; j++)
            {
                if (params[1] === tc[j].name)
                {
                    if (client.tc.id !== tc[j].id)
                    {
                        if (_can(["SEND_MESSAGES"], tc[j]))
                        {
                            client.tc = {id: tc[j].id, name: tc[j].name};
                            write_changes();
                            str = "Default set!";
                            return {promise: msg.reply(str), content: str};
                        }
                        else
                        {
                            str = "Cannot send messages there!";
                            return {promise: msg.reply(str), content: str};
                        }
                    }
                    else
                    {
                        str = "Already default channel!";
                        return {promise: msg.reply(str), content: str};
                    }
                }
            }
            str = `Could not find ${params[1]} channel!`;
            return {promise: msg.reply(str), content: str};
        }
    },
    // prefs
    {
        command: "prefs",
        description: "Display current bot preferences",
        parameters: [],
        rank: 2,
        execute: function(msg)
        {
            var client = get_client(msg);
            var guild = bot.Guilds.toArray().find(g => g.id === client.server.id);
            var vip_role = "";
            if (client.vip !== null)
            {
                var role = guild.roles.find(r => r.id === client.vip);
                vip_role = role.name;
            }
            else
            {
                vip_role = "None";
            }
            msg.reply("Preferences", false, {
                color: 0x3498db,
                fields: [{name: "Default Text Channel", value: client.tc.name},
                {name: "Default Voice Channel", value: client.vc.name},
                {name: "VIP Role", value: vip_role},
                {name: "Autoplay", value: client.autoplay},
                {name: "Announce Now Playing", value: client.inform_np},
                {name: "Announce Now Playing from Autoplay", value: client.announce_auto},
                {name: "Memes", value: client.meme},
                {name: "Music Volume", value: `${client.volume}%`}]
            })
            .then((m) =>
            {
                setTimeout(function(){m.delete();}, 25000);
            });
        }
    },
    // vip
    {
        command: "vip",
        description: "Set VIP role",
        parameters: ["role name"],
        rank: 3,
        execute: function(msg, params)
        {
            var full_param = "";
            for (var i = 1; i < params.length; i++)
            {
                if (i !== 1)
                {
                    full_param += " ";
                }
                full_param += params[i];
            }
            var client = get_client(msg);
            var str = "";
            for (var j = 0; j < msg.guild.roles.length; j++)
            {
                if (full_param === msg.guild.roles[j].name)
                {
                    if (msg.guild.roles[j].id !== client.vip)
                    {
                        client.vip = msg.guild.roles[j].id;
                        write_changes();
                        str = "VIP set!";
                        return {promise: msg.reply(str), content: str};
                    }
                    else
                    {
                        str = "VIP is already set to that role!";
                        return {promise: msg.reply(str), content: str};
                    }
                }
            }
            str = `Could not find role "${full_param}"`;
            return {promise: msg.reply(str), content: str};
        }
    },
    /*
    //restart
    {
        command: "restart",
        description: "Restart the bot",
        parameters: [],
        execute: function(msg)
        {
            var client = get_client(msg);
            if (client.server.isOwner(msg.author))
            {
                bot.disconnect();
            }
            else
            {
                msg.reply("Must be server owner!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
        }
    },
    */
    // meme hell
    {
        //meme hell
        command: "memes",
        description: "Memes",
        parameters: [],
        execute: function(msg, text) {
            text = text.toLowerCase();
            var client = get_client(msg);
            //MEME HELL DO NOT GO BELOW

            //DVA EXAMPLE
            if (text.includes(" dva ") || text === "dva")
            {
                msg.channel.uploadFile("images\\kek.png");
            }
            //ayya
            if (text.includes(" ayya ") || text === "ayya")
            {
                msg.channel.sendMessage("AYYA AYYA AYYA");
            }
            //panda
            if (text.includes(" panda ") || text === "panda")
            {
                msg.channel.sendMessage("Panda\nPanda\nPanda\nPanda\nPanda");
            }
            //stain
            if (text.includes(" stain ") || text === "stain")
            {
                msg.channel.sendMessage("STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN");
            }
            //baby
            if (text.includes(" baby ") || text === "baby")
            {
                msg.channel.uploadFile("images\\baby.gif", "images\\baby.gif");
            }
            //ban
            if (text.includes(" ban ") || text === "ban")
            {
                msg.channel.uploadFile("images\\ban.jpg");
            }
            //bb
            if (text.includes(" bb ") || text === "bb")
            {
                msg.channel.sendMessage("Big Brother is watching™");
            }
            //black
            if (text.includes(" black ") || text === "black")
            {
                msg.channel.sendMessage("'I hate black people, I swear' ~Fig 2016");
            }
            //blueberry
            if (text.includes(" blueberry pie ") || text === "blueberry pie")
            {
                msg.channel.sendMessage("BLUEBERRY FUCKING PIE? WHAT KIND OF FILTHY, UNWASHED, DEGENERATES DECIDED TO COME UP WITH THIS SHIT. FIRST YOU GIVE PEOPLE THE POWER TO DICTATE THEIR CREAM FILLING, NOW YOU'RE LETTING THEM CONDENSE A HOME COOKED PASTRY INTO A BITE SIZED CRUMPET SHIT? REALLY? FUCKING REALLY? I AM GOING TO FIND WHEVER MADE THIS ONLY TO DISEMBOWLE THEM, INFLATE THEIR ORGANS AND SHOVE THEM BACK INSIDE, SO THAT THEIR BODY RESEMBLES THE BLUEBERRY GIRL IN CHARLIE AND THE CHOCOLA-FUCKING-TE FACTA-FUCKING-ORY. THAT'S RIGHT. THAT'S WHO CREATED THIS. IT'S EVIL AND I SHALL HAVE NO PART OF IT. IF YOU HAVE A CONCIENSE, OR ANY SEMPLENCE OF A SOUL, YOU WILL THROW THOSE AWAY, OR BETTER YET, BURN THEM AND SPREAD THEIR ASHES THOROUGHLY INTO A VENUS FLYTRAP FLOWERBED. THAT IS ALL.");
            }
            //boob
            if (text.includes(" boob ") || text === "boob")
            {
                msg.channel.uploadFile("images\\underboob.jpg");
            }
            //bruh
            if (text === "bruh")
            {
                msg.channel.uploadFile("images\\bruh.jpg");
            }
            //bye
            if (text.includes(" bye ") || text === "bye")
            {
                msg.channel.uploadFile("images\\bye.gif", "images\\bye.gif");
            }
            //daddy
            if (text.includes(" daddy ") || text === "daddy")
            {
                msg.channel.sendMessage("<@192158164798406658>");
            }
            //danganroppa
            if (text.includes("danganroppa"))
            {
                msg.channel.sendMessage("Dangit Wrongpan?");
            }
            //debbie
            if (text.includes("debbie"))
            {
                msg.channel.sendMessage("WHAT WILL DEBBIE THINK!");
            }
            //dilligaf
            if (text.includes("dilligaf"))
            {
                msg.channel.uploadFile("images\\dilligaf.png");
            }
            //doyoueven
            if (text.includes(" doyoueven ") || text === "doyoueven" || text.includes("do you even ") || text === "do you even")
            {
                msg.channel.uploadFile("images\\doyoueven.jpg");
            }
            //dozicus
            if (text.includes("dozicus"))
            {
                msg.channel.sendMessage("DozicusPrimeTheDestroyerOfWorldsFredButtonIdiotMushroomBurger Stormborn of house targaryen, first of her name, queen of the andals and first men, khaleesi, mother of dragons and breaker of chains.");
            }
            //embargo
            if (text.includes("embargo"))
            {
                msg.channel.sendMessage("But now, Gwilith was dead. His world had turned into his worst enemy, and now the only thing he knew was the wind. This was the beginning of Embargo. This was the beginning of the end. <@185936558036090880>");
            }
            //fig
            if (text.includes(" fig ") || text === "fig")
            {
                msg.channel.sendMessage("WHAT WOULD FIG DO!");
                msg.channel.sendMessage("'I hate black people, I swear' ~Fig 2016");
            }
            //gg
            if (text.includes(" gg ") || text === "gg")
            {
                msg.channel.sendMessage("<:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128> <:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128> <:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128> <:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128> <:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128>");
            }
            //goodshit
            if (text.includes("goodshit") || text.includes("good shit"))
            {
                msg.channel.sendMessage("👌👀👌👀👌👀👌👀👌👀 good shit go౦ԁ sHit👌 thats ✔ some good👌👌shit right👌👌th 👌 ere👌👌👌 right✔there ✔✔if i do ƽaү so my selｆ 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 👌👌 👌НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ👌 👌👌 👌 💯 👌 👀 👀 👀 👌👌Good shit");
            }
            //highfive
            if (text.includes("highfive") || text.includes("high five"))
            {
                msg.channel.uploadFile("images\\highfive.jpg");
            }
            //hue
            if (text.includes("hue"))
            {
                msg.channel.sendMessage("HUE+HUE+HUE+HUE+HUE+HUE+HUE+HUE+");
            }
            //ignis
            if (text.includes("ignis"))
            {
                msg.channel.uploadFile("images\\ignis.gif", "images\\ignis.gif");
            }
            //iwata
            if (text.includes("iwata"))
            {
                msg.channel.uploadFile("images\\iwata.jpg");
            }
            //jon
            if (text.includes(" jon ") || text === "jon")
            {
                msg.channel.uploadFile("images\\jon.gif", "images\\jon.gif");
            }
            //left
            if (text.includes(" left ") || text === "left")
            {
                msg.channel.uploadFile("images\\left.jpg");
            }
            //lmao
            if (text.includes("lmao"))
            {
                client.lmao_count++;
                if (client.lmao_count > 10)
                {
                    client.lmao_count = 0;
                    msg.channel.sendMessage("What the ayy did you just fucking lmao about me, you ayy lmao? I'll have you know I graduated top of my ayy in the Lmaos, and I've been involved in numerous Lmao's on Ayyl-Quaeda, and I have over 300 confirmed lmaos. I am trained in ayy lmao and I'm the top ayy in the entire US lmao. You are nothing to me but just another ayy. I will ayy you the fuck lmao with ayy the likes of which has never been seen lmao'd on this Earth, mark my ayy lmao. You think you can get away with ayying that lmao to me over the Internet? Think again, fucker. As we speak I am ayying my secret network of lmaos across the USA and your ayy is being traced right now so you better prepare for the lmao, maggot. The lmao that ayys out the pathetic little thing you call your lmao. You're ayy lmao, kid. I can ayy anywhere, anytime, and I can lmao you in over seven hundred ways, and that's just with my bare lmao. Not only am I extensively trained in ayy lmao, but I have access to the entire ayy of the United States Lmao and I will use it to its full extent to ayy your miserable lmao off the face of the continent, you little shit. If only you could have known what unholy ayy your little “clever” lmao was about to bring down upon you, maybe you would have held your fucking ayy. But you couldn’t, you didn’t, and now you’re ayying the lmao, you goddamn idiot. I will ayy lmao all over you and you will ayy in it. You’re fucking lmao, kiddo");
                }
            }
            //mao
            if (text.includes(" mao ") || text === "mao")
            {
                msg.channel.uploadFile("images\\mao.jpg");
            }
            //minarah
            if (text.includes("minarah"))
            {
                msg.channel.sendMessage("Minarah Dark Blade the Black Rose, she grew up a bandit, a warrior, was trained as an assassin. She's had a hard life. She's *not* a hero. <@119963118016266241>");
            }
            //miyamoto
            if (text.includes("miyamoto"))
            {
                msg.channel.uploadFile("images\\miyamoto.gif", "images\\miyamoto.gif");
            }
            //myswamp
            if (text.includes("swamp"))
            {
                if (client.swamp)
                {
                    client.swamp = false;
                    msg.channel.uploadFile("images\\swamp1.png");
                }
                else
                {
                    client.swamp = true;
                    msg.channel.uploadFile("images\\swamp2.png");
                }
            }
            //nebby
            if (text.includes("nebby"))
            {
                msg.channel.uploadFile("images\\nebby.gif", "images\\nebby.gif");
            }
            //pedo
            if (text.includes("pedo"))
            {
                msg.channel.uploadFile("images\\pedo.png");
            }
            //pepe
            if (text.includes(" pepe ") || text === "pepe")
            {
                msg.channel.sendMessage("*FUCKING PEPE,THAT SCUM ON MY BALLSACK!. FUCK THAT BUNDLE OF STICKS SHOVING UP HIS ASS HAVING 'I LIVE WITH MY MOM' JORDAN 3'S WEARING MOTHERHUGGER! THAT SOUTHERN, 'I CHEATED ON MY SISTER WITH MY MOTHER' COUNTRY ASS MOTHERHUGGER. BUT YEAH, FUCK HIM...*");
            }
            //petyr
            if (text.includes("petyr"))
            {
                msg.channel.uploadFile("images\\petyr.jpeg");
            }
            //pls
            if (text.includes("please the team") || text.includes("pleasetheteam") || text === "pls")
            {
                msg.channel.uploadFile("images\\pls.gif", "images\\pls.gif").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 30000);
                });
            }
            //poopkink
            if (text.includes("poopkink"))
            {
                msg.channel.sendMessage("http://www.poopkink.com");
            }
            //pushthepayload
            if (text.includes("payload"))
            {
                msg.channel.uploadFile("images\\payload.gif", "images\\payload.gif");
            }
            //snorlax
            if (text.includes("snorlax"))
            {
                msg.channel.uploadFile("images\\snorlax.gif", "images\\snorlax.gif");
            }
            //sonicno
            if (text.includes("sonicno") || text.includes("sonic no"))
            {
                msg.channel.uploadFile("images\\sonicno.jpg");
            }
            //spookyshit
            if (text.includes("spookyshit") || text.includes("spooky shit"))
            {
                msg.channel.sendMessage("🎃👻🎃👻🎃👻👻👻🎃👻 spooky shit spooky sHit🎃 thats ✔ some spooky🎃🎃shit right🎃🎃th 🎃 ere🎃🎃🎃 right✔there ✔✔if i do ƽaү so my selｆ 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 🎃🎃 🎃НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ🎃 🎃 🎃 🎃 💯 🎃 👻👻 👻 🎃🎃spooky shit 🎃👻🎃👻🎃👻👻👻🎃👻 spooky shit spooky sHit🎃 thats ✔ some spooky🎃🎃shit right🎃🎃th 🎃 ere🎃🎃🎃 right✔there ✔✔if i do ƽaү so my selｆ 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 🎃🎃 🎃НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ🎃 🎃 🎃 🎃 💯 🎃 👻👻 👻 🎃🎃spooky shit");
            }
            //tbc
            if (text.includes("tbc") || text.includes("tobecontinued") || text.includes("to be continued"))
            {
                msg.channel.uploadFile("images\\tbc.png");
            }
            //valor
            if (text.includes("valor"))
            {
                msg.channel.uploadFile("images\\valor.png");
            }
            //who
            if (text.includes("who are th") || text === "who")
            {
                msg.channel.uploadFile("images\\people.gif", "images\\people.gif");
            }
            //womb
            if (text.includes("womb"))
            {
                msg.channel.uploadFile("images\\womb.gif", "images\\womb.gif");
            }
        }
    }
];
