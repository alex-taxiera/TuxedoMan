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

bot.Dispatcher.on("GATEWAY_READY", () =>
{
    s = [];
    console.log("BZZT ONLINE BZZT");
    fs.stat(serverdata, function(err)
    {
        var servers = bot.Guilds.toArray();
        if(!err)
        {
            var tmp = undefined;
            var old_servers = JSON.parse(fs.readFileSync(serverdata, "utf-8"));
            if (old_servers === [])
            {
                console.log("BZZT EMPTY SERVER FILE BZZT");
                return sweep_clients_and_init(servers);
            }
            for (var i = 0; i < servers.length; i++)
            {
                var j;
                for (j = 0; j < old_servers.length; j++)
                {
                    if (servers[i].id === old_servers[j].server.id)
                    {
                        tmp = {};
                        tmp.position = j;
                        tmp.server = servers[i];
                        break;
                    }
                }
                if (tmp !== undefined)
                {
                    var tc = servers[i].textChannels;
                    for (j = 0; j < tc.length; j++)
                    {
                        if (tc[j].id === old_servers[tmp.position].tc.id)
                        {
                            if (bot.User.permissionsFor(tc[j]).Text.SEND_MESSAGES)
                            {
                                tmp.tc = tc[j];
                                break;
                            }
                        }
                    }
                    if (tmp.tc === undefined)
                    {
                        for (j = 0; j < tc.length; j++)
                        {
                            if (bot.User.permissionsFor(tc[j]).Text.SEND_MESSAGES)
                            {
                                tmp.tc = tc[j];
                                break;
                            }
                        }
                    }
                    var vc = servers[i].voiceChannels;
                    for (j = 0; j < vc.length; j++)
                    {
                        if (vc[j].id === old_servers[tmp.position].vc.id)
                        {
                            if (bot.User.permissionsFor(vc[j]).Voice.SPEAK && bot.User.permissionsFor(vc[j]).Voice.CONNECT)
                            {
                                vc[j].join();
                                tmp.vc = vc[j];
                                break;
                            }
                        }
                    }
                    if (tmp.vc === undefined)
                    {
                        for (j = 0; j < vc.length; j++)
                        {
                            if (bot.User.permissionsFor(vc[j]).Voice.SPEAK && bot.User.permissionsFor(vc[j]).Voice.CONNECT)
                            {
                                vc[j].join();
                                tmp.vc = vc[j];
                                break;
                            }
                        }
                    }
                    s.push({
                        server: tmp.server,
                        tc: tmp.tc,
                        vc: tmp.vc,
                        vip: old_servers[tmp.position].vip,
                        queue: [],
                        now_playing: {},
                        is_playing: false,
                        paused: false,
                        autoplay: old_servers[tmp.position].autoplay,
                        inform_np: old_servers[tmp.position].inform_np,
                        announce_auto: old_servers[tmp.position].announce_auto,
                        encoder: {},
                        volume: 25,
                        meme: old_servers[tmp.position].meme,
                        swamp: true,
                        lmao_count: 0
                    });
                    delete servers[i];
                    tmp = undefined;
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
    if (!msg.author.bot)
    {
        if (text[0] == "*")
        {
            if (handle_command(msg, text.substring(1), false))
            {
                delete_invoke(msg);
            }
        }
        else if (get_client(msg).meme)
        {
            handle_command(msg, text, true);
        }
    }
});

function sweep_clients_and_init(servers)
{
    for (var i = 0; i < servers.length; i++)
    {
        if (servers[i] !== undefined)
        {
            var tmp = {};
            var j;
            tmp.server = servers[i];

            var tc = servers[i].textChannels;
            for (j = 0; j < tc.length; j++)
            {
                if (bot.User.permissionsFor(tc[j]).Text.SEND_MESSAGES)
                {
                    tmp.tc = tc[j];
                    break;
                }
            }

            var vc = servers[i].voiceChannels;
            for (j = 0; j < vc.length; j++)
            {
                if (bot.User.permissionsFor(vc[j]).Voice.SPEAK && bot.User.permissionsFor(vc[j]).Voice.CONNECT)
                {
                    vc[j].join();
                    tmp.vc = vc[j];
                    break;
                }
            }
            s.push({
                server: tmp.server,
                tc: tmp.tc,
                vc: tmp.vc,
                vip: null,
                queue: [],
                now_playing: {},
                is_playing: false,
                paused: false,
                autoplay: true,
                inform_np: true,
                announce_auto: true,
                encoder: {},
                volume: 25,
                meme: true,
                swamp: true,
                lmao_count: 0
            });
        }
    }
    write_changes();

    bot.User.setGame("BZZT KILLING BZZT");
    console.log("BZZT READY TO KILL BZZT");

    for (i = 0; i < s.length; i++)
    {
        if (s[i].autoplay)
        {
            console.log(`BZZT AUTOPLAY FOR ${s[i].server.name.toUpperCase()} BZZT`);
            play_next_song(s[i]);
        }
    }
}

function write_changes()
{
    var tmp = [];
    for (var i = 0; i < s.length; i++)
    {
        tmp.push({
            server: {id: s[i].server.id, name: s[i].server.name},
            tc: {id: s[i].tc.id, name: s[i].tc.name},
            vc: {id: s[i].vc.id, name: s[i].vc.name},
            vip: s[i].vip,
            autoplay: s[i].autoplay,
            inform_np: s[i].inform_np,
            announce_auto: s[i].announce_auto,
            meme: s[i].meme
        });
    }
    fs.writeFileSync(serverdata, JSON.stringify(tmp, null, 2), "utf-8");
}

function get_client(e)
{
    if (e.guildId)
    {
        for (var i = 0; i < s.length; i++)
        {
            if (s[i].server.id === e.guildId)
            {
                return s[i];
            }
        }
    }
    else if (e.guild.id)
    {
        for (var i = 0; i < s.length; i++)
        {
            if (s[i].server.id === e.guild.id)
            {
                return s[i];
            }
        }
    }
}

function auto_queue(client, msg)
{
    // get a random video
    var randomList = Math.floor((rng() * files.length));
    var autoplaylist = JSON.parse(fs.readFileSync(`playlist\\${files[randomList]}`, "utf-8"));
    var randomLineIndex = Math.floor(rng() * autoplaylist.length);
    var video = autoplaylist[randomLineIndex].link;

    ytdl.getInfo(video, [], {maxBuffer: Infinity}, (error, info) =>
    {
        if (error)
        {
            console.log(`ERROR: ${video} ${error}`);
            return auto_queue();
        }
        else
        {
            client.queue.push({title: info.title, url: video, user: bot.User});
            play_next_song(client, msg);
        }
    });
}

function add_to_queue(video, msg, mute = false)
{
    var client = get_client(msg);
    ytdl.getInfo(video, [], {maxBuffer: Infinity}, (error, info) =>
    {
        if(error)
        {
            msg.reply(`The requested video (${video}) does not exist or cannot be played.`);
            console.log(`Error (${video}): ${error}`);
        }
        else
        {
            client.queue.push({title: info.title, url: video, user: msg.author});

            if (!mute)
            {
                msg.reply(`\"${info.title}" has been added to the queue.`).then((m) =>
                {
                    setTimeout(function(){m.delete();}, 10000);
                });
            }
            if(!client.is_playing && client.queue.length === 1)
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
    client.encoder.voiceConnection.getEncoder().setVolume(vol);
}

function play_next_song(client, msg)
{
    if (client.queue.length === 0)
    {
        if (client.autoplay)
        {
            return auto_queue(client, msg);
        }
        else if (msg !== null)
        {
            return msg.reply("Nothing in the queue!").then((m) =>
            {
                setTimeout(function(){m.delete();}, 25000);
            });
        }
    }

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
            client.tc.sendMessage(`Now playing: "${title}" (requested by ${user.username})`).then((m) =>
            {
                setTimeout(function(){m.delete();}, 25000);
            });
        }

        var info = bot.VoiceConnections.getForGuild(client.server.id);
        client.encoder = info.voiceConnection.createExternalEncoder({
            type: "ffmpeg",
            source: `data\\${client.server.id}.mp3`,
            format: "pcm"
        });

        console.log(`BZZT SONG START ON ${client.server.name.toUpperCase()} BZZT`);
        client.encoder.play();
        volume(client, client.volume);
        //console.log(client.encoder);
        client.is_playing = true;

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
            else if (client.autoplay)
            {
                console.log(`BZZT AUTO QUEUE ON ${client.server.name.toUpperCase()} BZZT`);
                play_next_song(client, null);
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
        var params = text.split(" ");
        command = search_command(params[0]);

        if(command)
        {
            if (params.length - 1 < command.parameters.length)
            {
                msg.reply("Insufficient parameters!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 25000);
                });
            }
            else
            {
                command.execute(msg, params);
                return true;
            }
        }
    }
    else
    {
        command = search_command("memes");
        command.execute(msg, text);
    }
}

function search_video(msg, query)
{
    request(`https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=${encodeURIComponent(query)}&key=${yt_api_key}`, (error, response, body) =>
    {
        var json = JSON.parse(body);
        if ("error" in json)
        {
            msg.reply(`An error has occurred: ${json.error.errors[0].e} - ${json.error.errors[0].reason}`).then((m) =>
            {
                setTimeout(function(){m.delete();}, 25000);
            });
        }
        else if (json.items.length === 0)
        {
            msg.reply("No videos found matching the search criteria.").then((m) =>
            {
                setTimeout(function(){m.delete();}, 25000);
            });
        } else
        {
            add_to_queue(json.items[0].id.videoId, msg);
        }
    });
}

function queue_playlist(playlistId, msg, pageToken = "")
{
    request(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${yt_api_key}&pageToken=${pageToken}`, (error, response, body) =>
    {
        var json = JSON.parse(body);
        if ("error" in json)
        {
            msg.reply(`An error has occurred: ${json.error.errors[0].e} - ${json.error.errors[0].reason}`).then((m) =>
            {
                setTimeout(function(){m.delete();}, 25000);
            });
        }
        else if (json.items.length === 0)
        {
            msg.reply("No videos found within playlist.").then((m) =>
            {
                setTimeout(function(){m.delete();}, 25000);
            });
        }
        else
        {
            for (var i = 0; i < json.items.length; i++)
            {
                add_to_queue(json.items[i].snippet.resourceId.videoId, msg, true);
            }
            if (json.nextPageToken == null)
            {
                request(`https://www.googleapis.com/youtube/v3/playlists?part=snippet%2Clocalizations&id=${playlistId}&fields=items(localizations%2Csnippet%2Flocalized%2Ftitle)&key=${yt_api_key}`, (e, r, body) =>
                {
                    var json = JSON.parse(body);
                    console.log(json);
                    msg.reply(`${json.items[0].snippet.localized.title} has been queued.`).then((m) =>
                    {
                        setTimeout(function(){m.delete();}, 5000);
                    });
                });
                return;
            }
            queue_playlist(playlistId, msg, json.nextPageToken);
        }
    });
}

function delete_invoke(msg)
{
    if (bot.User.permissionsFor(msg.channel).Text.MANAGE_MESSAGES)
    {
        setTimeout(function(){msg.delete();}, 5000);
    }
}

var commands =
[
    // volume
    {
        command: "volume",
        description: "Set music volume.",
        parameters: ["number (1-100)"],
        execute: function(msg, params)
        {
            if (params[1] > 0 && params[1] < 101)
            {
                volume(get_client(msg), params[1]);
                msg.reply("Volume set!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
            else
            {
                msg.reply("Invalid volume level!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
        }
    },
    // play
    {
        command: "play",
        description: "Resumes paused playback",
        parameters: [],
        execute: function(msg)
        {
            var client = get_client(msg);
            if (client.paused)
            {
                client.paused = false;
                if (client.is_playing)
                {
                    client.encoder.voiceConnection.getEncoderStream().uncork();
                }
                msg.reply("Resuming!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
            else
            {
                msg.reply("Playback is already running").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }

        }
    },
    // pause
    {
        command: "pause",
        description: "Pauses your shit",
        parameters: [],
        execute: function(msg)
        {
            var client = get_client(msg);
            if (client.paused)
            {
                msg.reply("Playback is already paused*").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
            else
            {
                client.paused = true;
                if (client.is_playing)
                {
                    client.encoder.voiceConnection.getEncoderStream().cork();
                }
                msg.reply("Pausing!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
        }
    },
    // skip
    {
        command: "skip",
        description: "Skips the current song",
        parameters: [],
        execute: function(msg)
        {
            var client = get_client(msg);
            if(client.is_playing)
            {
                msg.reply("Skipping...").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
                client.encoder.destroy();
            }
            else
            {
                msg.reply("There is nothing being played.").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
        }
    },
    // request
    {
        command: "request",
        description: "Adds the requested video to the playlist queue",
        parameters: ["video URL, video ID, playlist URL or alias"],
        execute: function(msg, params)
        {
            var regExp = /^.*(youtu.be\/|list=)([^#\&\?]*).*/;
            var match = params[1].match(regExp);

            if (match && match[2]){
                queue_playlist(match[2], msg);
            }
            else
            {
                add_to_queue(params[1], msg);
            }
        }
    },
    // search
    {
        command: "search",
        description: "Searches for a video on YouTube and adds it to the queue",
        parameters: ["query"],
        execute: function(msg, params)
        {
            if (yt_api_key === null)
            {
                msg.reply("You need a YouTube API key in order to use the !search command. Please see https://github.com/agubelu/discord-music-bot#obtaining-a-youtube-api-key").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 15000);
                });
            }
            else
            {
                var q = "";
                for (var i = 1; i < params.length; i++)
                {
                    q += params[i] + " ";
                }
                search_video(msg, q);
            }

        }
    },
    // np
    {
        command: "np",
        description: "Displays the current song",
        parameters: [],
        execute: function(msg)
        {
            var client = get_client(msg);
            var response = "Now playing: ";
            if(client.is_playing)
            {
                response += `"${client.now_playing.title}" (requested by ${client.now_playing.user.username})`;
            }
            else
            {
                response += "nothing!";
            }
            msg.reply(response).then((m) =>
            {
                setTimeout(function(){m.delete();}, 10000);
            });
        }
    },
    // queue
    {
        command: "queue",
        description: "Displays the queue",
        parameters: [],
        execute: function(msg) {
            var response = "";
            var client = get_client(msg);
            if(client.queue.length === 0)
            {
                response = "the queue is empty.";
            }
            else
            {
                var long_queue = client.queue.length > 30;
                for (var i = 0; i < (long_queue ? 30 : client.queue.length); i++)
                {
                    response += `"${client.queue[i].title}" (requested by ${client.queue[i].user})`;
                }
                if (long_queue)
                {
                    response += `\n**...and ${(client.queue.length - 30)} more.**`;
                }
            }
            msg.reply(response).then((m) =>
            {
                setTimeout(function(){m.delete();}, 20000);
            });
        }
    },
    // commands
    {
        command: "commands",
        description: "Displays this message, duh!",
        parameters: [],
        execute: function(msg) {
            var response = "Available commands:";

            for(var i = 0; i < commands.length; i++) {
                var c = commands[i];
                response += `\n* ${c.command}`;

                for(var j = 0; j < c.parameters.length; j++) {
                    response += ` <${c.parameters[j]}>`;
                }

                response += `: ${c.description}`;
            }
            msg.author.openDM().then(dm => {
                dm.sendMessage(response);
            });

        }
    },
    // clearqueue
    {
        command: "clearqueue",
        description: "Removes all songs from the queue",
        parameters: [],
        execute: function(msg)
        {
            var client = get_client(msg);

            if (client.server.isOwner(msg.author) || msg.member.hasRole(client.vip))
            {
                client.queue = [];
                msg.reply("Queue has been cleared!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
            else
            {
                msg.reply("Must be VIP!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
        }
    },
    // remove
    {
        command: "remove",
        description: "Removes a song from the queue",
        parameters: ["Request index or 'last'"],
        execute: function(msg, params)
        {
            var index = params[1];
            var client = get_client(msg);
            if (client.server.isOwner(msg.author) || msg.member.hasRole(client.vip))
            {
                if (client.queue.length === 0)
                {
                    msg.reply("The queue is empty").then((m) =>
                    {
                        setTimeout(function(){m.delete();}, 5000);
                    });

                } else if(isNaN(index) && index !== "last")
                {
                    msg.reply(`Argument "${index}" is not a valid index.`).then((m) =>
                    {
                        setTimeout(function(){m.delete();}, 5000);
                    });
                }

                if (index === "last") {index = client.queue.length;}
                index = parseInt(index);
                if (index < 1 || index > client.queue.length)
                {
                    msg.reply(`Cannot remove request #${index} from the queue (there are only ${client.queue.length} requests currently)`).then((m) =>
                    {
                        setTimeout(function(){m.delete();}, 5000);
                    });
                }

                var deleted = client.queue.splice(index - 1, 1);
                msg.reply(`Request "${deleted[0].title}" was removed from the queue.`).then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
            else
            {
                msg.reply("Must be VIP!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
        }
    },
    // toggle np
    {
        command: "nptoggle",
        description: "Toggle announcing when a song starts playing",
        parameters: [],
        execute: function(msg)
        {
            var client = get_client(msg);
            if (client.server.isOwner(msg.author) || msg.member.hasRole(client.vip))
            {
                client.inform_np = !client.inform_np;
                msg.reply(`Now Playing announcements set to ${client.inform_np}!`).then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
                return write_changes();
            }
            else
            {
                msg.reply("Must be server VIP!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
        }
    },
    // toggle auto np
    {
        command: "autonptoggle",
        description: "Toggle announcing when an autoplay song starts playing",
        parameters: [],
        execute: function(msg)
        {
            var client = get_client(msg);
            if (client.server.isOwner(msg.author) || msg.member.hasRole(client.vip))
            {
                client.announce_auto = !client.announce_auto;
                msg.reply(`Now Playing (autoplay) announcements set to ${client.announce_auto}!`).then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
                return write_changes();
            }
            else
            {
                msg.reply("Must be server VIP!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
        }
    },
    // toggle autoplay
    {
        command: "autotoggle",
        description: "Toggle music autoplay",
        parameters: [],
        execute: function(msg)
        {
            var client = get_client(msg);
            if (client.server.isOwner(msg.author) || msg.member.hasRole(client.vip))
            {
                client.autoplay = !client.autoplay;
                msg.reply(`Autoplay set to ${client.autoplay}!`).then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
                if (client.autoplay)
                {
                    play_next_song(client);
                }
                return write_changes();
            }
            else
            {
                msg.reply("Must be server VIP!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
        }
    },
    // toggle meme
    {
        command: "memetoggle",
        description: "Toggle meme posting",
        parameters: [],
        execute: function(msg)
        {
            var client = get_client(msg);
            if (client.server.isOwner(msg.author) || msg.member.hasRole(client.vip))
            {
                client.meme = !client.meme;
                msg.reply(`Meme posting set to ${client.meme}!`).then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
                write_changes();
            }
            else
            {
                msg.reply("Must be server VIP!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
        }
    },
    // setvoice
    {
        command: "voice",
        description: "Set voice channel to start up in.",
        parameters: ["voice channel name"],
        execute: function(msg, params)
        {
            var client = get_client(msg);
            var vc = bot.Channels.voiceForGuild(msg.guild);
            if (client.server.isOwner(msg.author) || msg.member.hasRole(client.vip))
            {
                for (var j = 0; j < vc.length; j++)
                {
                    if (params[1] === vc[j].name)
                    {
                        if (client.vc !== vc[j])
                        {
                            // need to check perms
                            client.vc = vc[j];
                            msg.reply("Default set!").then((m) =>
                            {
                                setTimeout(function(){m.delete();}, 5000);
                            });
                            write_changes();
                            return vc[j].join();
                        }
                        else
                        {
                            return msg.reply("Already default channel!").then((m) =>
                            {
                                setTimeout(function(){m.delete();}, 5000);
                            });
                        }
                    }
                }
                msg.reply(`Could not find ${params[1]} channel!`).then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
            else
            {
                msg.reply("Must be server VIP!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
        }
    },
    // settext
    {
        command: "text",
        description: "Set text channel to announce things in.",
        parameters: ["text channel name"],
        execute: function(msg, params)
        {
            var client = get_client(msg);
            var tc = bot.Channels.textForGuild(msg.guild);

            if (client.server.isOwner(msg.author) || msg.member.hasRole(client.vip))
            {
                for (var j = 0; j < tc.length; j++)
                {
                    if (params[1] === tc[j].name)
                    {
                        if (client.tc !== tc[j])
                        {
                            // need to check perms
                            client.tc = tc[j];
                            msg.reply("Default set!").then((m) =>
                            {
                                setTimeout(function(){m.delete();}, 5000);
                            });
                            return write_changes();
                        }
                        else
                        {
                            return msg.reply("Already default channel!").then((m) =>
                            {
                                setTimeout(function(){m.delete();}, 5000);
                            });
                        }
                    }
                }
                msg.reply(`Could not find ${params[1]} channel!`).then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
            else
            {
                msg.reply("Must be VIP!").then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
            }
        }
    },
    // vip
    {
        command: "vip",
        description: "Set VIP role",
        parameters: ["role name"],
        execute: function(msg, params)
        {
            console.log(params);
            var full_param = "";
            for (var i = 1; i < params.length; i++)
            {
                if (i !== 1)
                {
                    full_param += " ";
                }
                full_param += params[i];
            }
            console.log(full_param);
            var client = get_client(msg);
            if (client.server.isOwner(msg.author))
            {
                for (var j = 0; j < msg.guild.roles.length; j++)
                {
                    if (full_param === msg.guild.roles[j].name)
                    {
                        if (msg.guild.roles[j].id !== client.vip)
                        {
                            client.vip = msg.guild.roles[j].id;
                            msg.reply("VIP set!").then((m) =>
                            {
                                setTimeout(function(){m.delete();}, 5000);
                            });
                            write_changes();
                        }
                        else
                        {
                            msg.reply("VIP is already set to that role!").then((m) =>
                            {
                                setTimeout(function(){m.delete();}, 5000);
                            });
                        }
                    }
                }
                msg.reply(`Could not find role "${full_param}"`).then((m) =>
                {
                    setTimeout(function(){m.delete();}, 5000);
                });
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
    // restart
    // {
    //     command: "restart",
    //     description: "Restart the bot",
    //     parameters: [],
    //     execute: function(msg)
    //     {
    //         var client = get_client(msg);
    //         if (client.server.isOwner(msg.author))
    //         {
    //             bot.disconnect();
    //         }
    //         else
    //         {
    //             msg.reply("Must be server owner!").then((m) =>
    //             {
    //                 setTimeout(function(){m.delete();}, 5000);
    //             });
    //         }
    //     }
    // },
    // meme hell
    {
        //meme hell
        command: "memes",
        description: "Memes",
        parameters: [],
        execute: function(msg, text) {
            text = text.toLowerCase();
            //MEME HELL DO NOT GO BELOW

            //DVA EXAMPLE
            if (text.includes(" dva ") || text === "dva")
            {
                msg.channel.uploadFile("images\\kek.png");
            }
            //ayya
            else if (text.includes(" ayya ") || text === "ayya")
            {
                msg.channel.sendMessage("AYYA AYYA AYYA");
            }
            //panda
            else if (text.includes(" panda ") || text === "panda")
            {
                msg.channel.sendMessage("Panda\nPanda\nPanda\nPanda\nPanda");
            }
            //stain
            else if (text.includes(" stain ") || text === "stain")
            {
                msg.channel.sendMessage("STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN");
            }
            //baby
            else if (text.includes(" baby ") || text === "baby")
            {
                msg.channel.uploadFile("images\\baby.gif", "images\\baby.gif");
            }
            //ban
            else if (text.includes(" ban ") || text === "ban")
            {
                msg.channel.uploadFile("images\\ban.jpg");
            }
            //bb
            else if (text.includes(" bb ") || text === "bb")
            {
                msg.channel.sendMessage("Big Brother is watching™");
            }
            //black
            else if (text.includes(" black ") || text === "black")
            {
                msg.channel.sendMessage("'I hate black people, I swear' ~Fig 2016");
            }
            //blueberry
            else if (text.includes(" blueberry pie ") || text === "blueberry pie")
            {
                msg.channel.sendMessage("BLUEBERRY FUCKING PIE? WHAT KIND OF FILTHY, UNWASHED, DEGENERATES DECIDED TO COME UP WITH THIS SHIT. FIRST YOU GIVE PEOPLE THE POWER TO DICTATE THEIR CREAM FILLING, NOW YOU'RE LETTING THEM CONDENSE A HOME COOKED PASTRY INTO A BITE SIZED CRUMPET SHIT? REALLY? FUCKING REALLY? I AM GOING TO FIND WHEVER MADE THIS ONLY TO DISEMBOWLE THEM, INFLATE THEIR ORGANS AND SHOVE THEM BACK INSIDE, SO THAT THEIR BODY RESEMBLES THE BLUEBERRY GIRL IN CHARLIE AND THE CHOCOLA-FUCKING-TE FACTA-FUCKING-ORY. THAT'S RIGHT. THAT'S WHO CREATED THIS. IT'S EVIL AND I SHALL HAVE NO PART OF IT. IF YOU HAVE A CONCIENSE, OR ANY SEMPLENCE OF A SOUL, YOU WILL THROW THOSE AWAY, OR BETTER YET, BURN THEM AND SPREAD THEIR ASHES THOROUGHLY INTO A VENUS FLYTRAP FLOWERBED. THAT IS ALL.");
            }
            //boob
            else if (text.includes(" boob ") || text === "boob")
            {
                msg.channel.uploadFile("images\\underboob.jpg");
            }
            //bye
            else if (text.includes(" bye ") || text === "bye")
            {
                msg.channel.uploadFile("images\\bye.gif", "images\\bye.gif");
            }
            //daddy
            else if (text.includes(" daddy ") || text === "daddy")
            {
                msg.channel.sendMessage("<@192158164798406658>");
            }
            //danganroppa
            else if (text.includes("danganroppa"))
            {
                msg.channel.sendMessage("Dangit Wrongpan?");
            }
            //debbie
            else if (text.includes("debbie"))
            {
                msg.channel.sendMessage("WHAT WILL DEBBIE THINK!");
            }
            //dilligaf
            else if (text.includes("dilligaf"))
            {
                msg.channel.uploadFile("images\\dilligaf.png");
            }
            //doyoueven
            else if (text.includes(" doyoueven ") || text === "doyoueven" || text.includes("do you even ") || text === "do you even")
            {
                msg.channel.uploadFile("images\\doyoueven.jpg");
            }
            //dozicus
            else if (text.includes("dozicus"))
            {
                msg.channel.sendMessage("DozicusPrimeTheDestroyerOfWorldsFredButtonIdiotMushroomBurger Stormborn of house targaryen, first of her name, queen of the andals and first men, khaleesi, mother of dragons and breaker of chains.");
            }
            //embargo
            else if (text.includes("embargo"))
            {
                msg.channel.sendMessage("But now, Gwilith was dead. His world had turned into his worst enemy, and now the only thing he knew was the wind. This was the beginning of Embargo. This was the beginning of the end. <@185936558036090880>");
            }
            //fig
            else if (text.includes(" fig ") || text === "fig")
            {
                msg.channel.sendMessage("WHAT WOULD FIG DO!");
                msg.channel.sendMessage("'I hate black people, I swear' ~Fig 2016");
            }
            //gg
            else if (text.includes(" gg ") || text === "gg")
            {
                msg.channel.sendMessage("<:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128> <:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128> <:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128> <:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128> <:golduck:250425534427824128> ***GIT GUD*** <:golduck:250425534427824128>");
            }
            //goodshit
            else if (text.includes("goodshit") || text.includes("good shit"))
            {
                msg.channel.sendMessage("👌👀👌👀👌👀👌👀👌👀 good shit go౦ԁ sHit👌 thats ✔ some good👌👌shit right👌👌th 👌 ere👌👌👌 right✔there ✔✔if i do ƽaү so my selｆ 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 👌👌 👌НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ👌 👌👌 👌 💯 👌 👀 👀 👀 👌👌Good shit");
            }
            //highfive
            else if (text.includes("highfive") || text.includes("high five"))
            {
                msg.channel.uploadFile("images\\highfive.jpg");
            }
            //hue
            else if (text.includes("hue"))
            {
                msg.channel.sendMessage("HUE+HUE+HUE+HUE+HUE+HUE+HUE+HUE+");
            }
            //ignis
            else if (text.includes("ignis"))
            {
                msg.channel.uploadFile("images\\ignis.gif", "images\\ignis.gif");
            }
            //iwata
            else if (text.includes("iwata"))
            {
                msg.channel.uploadFile("images\\iwata.jpg");
            }
            //jon
            else if (text.includes(" jon ") || text === "jon")
            {
                msg.channel.uploadFile("images\\jon.gif", "images\\jon.gif");
            }
            //left
            else if (text.includes(" left ") || text === "left")
            {
                msg.channel.uploadFile("images\\left.jpg");
            }
            //lmao
            else if (text.includes(" lmao ") || text === "lmao")
            {
                var client = get_client(msg);
                client.lmao_count++;
                if (client.lmao_count > 10)
                {
                    client.lmao_count = 0;
                    msg.channel.sendMessage("What the ayy did you just fucking lmao about me, you ayy lmao? I'll have you know I graduated top of my ayy in the Lmaos, and I've been involved in numerous Lmao's on Ayyl-Quaeda, and I have over 300 confirmed lmaos. I am trained in ayy lmao and I'm the top ayy in the entire US lmao. You are nothing to me but just another ayy. I will ayy you the fuck lmao with ayy the likes of which has never been seen lmao'd on this Earth, mark my ayy lmao. You think you can get away with ayying that lmao to me over the Internet? Think again, fucker. As we speak I am ayying my secret network of lmaos across the USA and your ayy is being traced right now so you better prepare for the lmao, maggot. The lmao that ayys out the pathetic little thing you call your lmao. You're ayy lmao, kid. I can ayy anywhere, anytime, and I can lmao you in over seven hundred ways, and that's just with my bare lmao. Not only am I extensively trained in ayy lmao, but I have access to the entire ayy of the United States Lmao and I will use it to its full extent to ayy your miserable lmao off the face of the continent, you little shit. If only you could have known what unholy ayy your little “clever” lmao was about to bring down upon you, maybe you would have held your fucking ayy. But you couldn’t, you didn’t, and now you’re ayying the lmao, you goddamn idiot. I will ayy lmao all over you and you will ayy in it. You’re fucking lmao, kiddo");
                }
            }
            //mao
            else if (text.includes(" mao ") || text === "mao")
            {
                msg.channel.uploadFile("images\\mao.jpg");
            }
            //minarah
            else if (text.includes("minarah"))
            {
                msg.channel.sendMessage("Minarah Dark Blade the Black Rose, she grew up a bandit, a warrior, was trained as an assassin. She's had a hard life. She's *not* a hero. <@119963118016266241>");
            }
            //miyamoto
            else if (text.includes("miyamoto"))
            {
                msg.channel.uploadFile("images\\miyamoto.gif", "images\\miyamoto.gif");
            }
            //myswamp
            else if (text.includes("swamp"))
            {
                var client = get_client(msg);
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
            else if (text.includes("nebby"))
            {
                msg.channel.uploadFile("images\\nebby.gif", "images\\nebby.gif");
            }
            //pedo
            else if (text.includes("pedo"))
            {
                msg.channel.uploadFile("images\\pedo.png");
            }
            //pepe
            else if (text.includes(" pepe ") || text === "pepe")
            {
                msg.channel.sendMessage("*FUCKING PEPE,THAT SCUM ON MY BALLSACK!. FUCK THAT BUNDLE OF STICKS SHOVING UP HIS ASS HAVING 'I LIVE WITH MY MOM' JORDAN 3'S WEARING MOTHERHUGGER! THAT SOUTHERN, 'I CHEATED ON MY SISTER WITH MY MOTHER' COUNTRY ASS MOTHERHUGGER. BUT YEAH, FUCK HIM...*");
            }
            //petyr
            else if (text.includes("petyr"))
            {
                msg.channel.uploadFile("images\\petyr.jpeg");
            }
            //pls
            else if (text.includes("please the team") || text.includes("pleasetheteam") || text === "pls")
            {
                msg.channel.uploadFile("images\\pls.gif", "images\\pls.gif");
            }
            //poopkink
            else if (text.includes("poopkink"))
            {
                msg.channel.sendMessage("http://www.poopkink.com");
            }
            //pushthepayload
            else if (text.includes("payload"))
            {
                msg.channel.uploadFile("images\\payload.gif", "images\\payload.gif");
            }
            //snorlax
            else if (text.includes("snorlax"))
            {
                msg.channel.uploadFile("images\\snorlax.gif", "images\\snorlax.gif");
            }
            //sonicno
            else if (text.includes("sonicno") || text.includes("sonic no"))
            {
                msg.channel.uploadFile("images\\sonicno.jpg");
            }
            //spookyshit
            else if (text.includes("spookyshit") || text.includes("spooky shit"))
            {
                msg.channel.sendMessage("🎃👻🎃👻🎃👻👻👻🎃👻 spooky shit spooky sHit🎃 thats ✔ some spooky🎃🎃shit right🎃🎃th 🎃 ere🎃🎃🎃 right✔there ✔✔if i do ƽaү so my selｆ 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 🎃🎃 🎃НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ🎃 🎃 🎃 🎃 💯 🎃 👻👻 👻 🎃🎃spooky shit 🎃👻🎃👻🎃👻👻👻🎃👻 spooky shit spooky sHit🎃 thats ✔ some spooky🎃🎃shit right🎃🎃th 🎃 ere🎃🎃🎃 right✔there ✔✔if i do ƽaү so my selｆ 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 🎃🎃 🎃НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ🎃 🎃 🎃 🎃 💯 🎃 👻👻 👻 🎃🎃spooky shit");
            }
            //tbc
            else if (text.includes("tbc") || text.includes("tobecontinued") || text.includes("to be continued"))
            {
                msg.channel.uploadFile("images\\tbc.png");
            }
            //valor
            else if (text.includes("valor"))
            {
                msg.channel.uploadFile("images\\valor.png");
            }
            //who
            else if (text.includes("who are th") || text === "who")
            {
                msg.channel.uploadFile("images\\people.gif", "images\\people.gif");
            }
            //womb
            else if (text.includes("womb"))
            {
                msg.channel.uploadFile("images\\womb.gif", "images\\womb.gif");
            }
        }
    }
];
