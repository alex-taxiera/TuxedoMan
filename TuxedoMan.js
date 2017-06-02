const Discordie = require("discordie");
const fs = require("fs");
const token = "token.txt";
const ytkey = "ytkey.txt";

// global variables
global.yt_api_key = "";
global.serverdata = "./data/servers.json";
global.playlist = "./playlist";
global.s; //s = servers (list of servers with all info)
global.bot = new Discordie({autoReconnect: true});

// project modules
var cmd = require("./commands.js");
var music = require("./music.js");
var func = require("./common.js");

// connect bot
start();

global.bot.Dispatcher.on("DISCONNECTED", e =>
{
    console.log(e.error);
    console.log(`auto reconnect ${e.autoReconnect}`);
    console.log(e.delay);
});

global.bot.Dispatcher.on("VOICE_CHANNEL_LEAVE", e =>
{
    var client = func.get_client(e.guildId);
    if (e.user.id === global.bot.User.id)
    {
        console.log(`BZZT LEFT CHANNEL ${e.channel.name.toUpperCase()} BZZT`);
        if (e.newChannelId === null)
        {
            var vc = global.bot.Channels.find(c => c.id == e.channelId);
            vc.join(vc).catch((e) => {console.log(e);});
        }
    }
    else if (client.is_playing && client.encoder.voiceConnection.channel.members.length === 1 && !client.paused)
    {
        client.paused = true;
        client.encoder.voiceConnection.getEncoderStream().cork();
    }
});

global.bot.Dispatcher.on("VOICE_CHANNEL_JOIN", e =>
{
    var client = func.get_client(e.guildId);
    if (client.is_playing && client.encoder.voiceConnection.channel.members.length === 1 && !client.paused)
    {
        client.paused = true;
        client.encoder.voiceConnection.getEncoderStream().cork();
    }
});

global.bot.Dispatcher.on("CHANNEL_CREATE", e =>
{
    if (client.tc !== undefined && client.vc !== undefined)
    {
        return;
    }
    else
    {
        var ch = e.channel;
        var client = func.get_client(ch.guild_id);

        if (ch.type === 0 && client.tc === undefined && func._can(["SEND_MESSAGES"], ch))
        {
            client.tc = {id: ch.id, name: ch.name};
        }
        else if (ch.type === 2 && client.vc === undefined && func._can(["SPEAK", "CONNECT"], ch))
        {
            ch.join();
            client.vc = {id: ch.id, name: ch.name};
        }
        func.write_changes();
    }
});

global.bot.Dispatcher.on("CHANNEL_DELETE", e =>
{
    var client = func.get_client(e.data.guild_id);
    var i;
    if (e.channelId === client.tc.id)
    {
        var tc = global.bot.Channels.textForGuild(client.server.id);
        for (i = 0; i < tc.length; i++)
        {
            if (func._can(["SEND_MESSAGES"], tc[i]))
            {
                client.tc = {id: tc[i].id, name: tc[i].name};
                break;
            }
        }
        if (e.channelId === client.tc.id)
        {
            client.tc = undefined;
        }
    }
    else if (e.channelId === client.vc.id)
    {
        var vc = global.bot.Channels.voiceForGuild(client.server.id);
        for (i = 0; i < vc.length; i++)
        {
            if (func._can(["SPEAK", "CONNECT"], vc[i]))
            {
                vc[i].join();
                client.vc = {id: vc[i].id, name: vc[i].name};
                break;
            }
        }
        if (e.channelId === client.vc.id)
        {
            client.vc = undefined;
        }
    }
    else
    {
        return;
    }
    func.write_changes();
});

global.bot.Dispatcher.on("GUILD_CREATE", e =>
{
    var servers = [];
    servers.push(e.guild);
    console.log(`BZZT JOINED ${e.guild.name} GUILD BZZT`);
    sweep_clients(servers);
});

global.bot.Dispatcher.on("GUILD_DELETE", e =>
{
    var index = global.s.findIndex(s => s.server.id === e.guildId);
    var client = func.get_client(e.guildId);
    console.log(`BZZT LEFT ${client.server.name} GUILD BZZT`);
    client.paused = true;
    if (client.is_playing)
    {
        client.encoder.destroy();
    }
    global.s.splice(index, 1);
    func.write_changes();
});

global.bot.Dispatcher.on("GATEWAY_READY", () =>
{
    global.s = [];
    console.log("BZZT ONLINE BZZT");
    global.bot.User.setGame("BZZT KILLING BZZT");
    fs.open(global.serverdata, "r", (err) =>
    {
        var servers = global.bot.Guilds.toArray();
        if(!err)
        {
            var tmp;
            var old_servers = JSON.parse(fs.readFileSync(global.serverdata, "utf-8"));
            if (old_servers.length === 0)
            {
                console.log("BZZT EMPTY SERVER FILE BZZT");
                return sweep_clients(servers);
            }
            var i;
            for (i = 0; i < servers.length; i++)
            {
                var j;
                tmp = undefined;
                for (j = 0; j < old_servers.length; j++)
                {
                    if (servers[i].id === old_servers[j].server.id)
                    {
                        tmp = {};
                        tmp.server = {id: servers[i].id, name: servers[i].name};
                    }
                    if (tmp !== undefined)
                    {
                        var k;
                        var old_tc = global.bot.Channels.textForGuild(tmp.server.id)
                        .find(c => c.id == old_servers[j].tc.id);
                        if (func._can(["SEND_MESSAGES"], old_tc))
                        {
                            tmp.tc = {id: old_tc.id, name: old_tc.name};
                        }
                        if (tmp.tc === undefined)
                        {
                            var tc = global.bot.Channels.textForGuild(tmp.server.id);
                            for (k = 0; k < tc.length; k++)
                            {
                                if (func._can(["SEND_MESSAGES"], tc[k]))
                                {
                                    tmp.tc = {id: tc[k].id, name: tc[k].name};
                                    break;
                                }
                            }
                        }

                        var old_vc = global.bot.Channels.voiceForGuild(tmp.server.id)
                        .find(c => c.id == old_servers[j].vc.id);
                        if (func._can(["SPEAK", "CONNECT"], old_vc))
                        {
                            old_vc.join();
                            tmp.vc = {id: old_vc.id, name: old_vc.name};
                        }
                        if (tmp.vc === undefined)
                        {
                            var vc = global.bot.Channels.voiceForGuild(tmp.server.id);
                            for (k = 0; k < vc.length; k++)
                            {
                                if (func._can(["SPEAK", "CONNECT"], vc[k]))
                                {
                                    vc[k].join();
                                    tmp.vc = {id: vc[k].id, name: vc[k].name};
                                    break;
                                }
                            }
                        }
                        global.s.push({
                            server:         tmp.server,
                            tc:             tmp.tc,
                            vc:             tmp.vc,
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
            var init_servers = [];
            for (i = 0; i < global.s.length; i++)
            {
                init_servers.push(global.s[i].server);
                var index = servers.findIndex(servers => servers.id === global.s[i].server.id);
                if (index !== -1)
                {
                    servers.splice(index, 1);
                }
            }
            setTimeout(function(){init(init_servers);}, 2000);
            sweep_clients(servers);
        }
        else
        {
            console.log("BZZT NO SERVER FILE BZZT");
            sweep_clients(servers);
        }
    });
});

global.bot.Dispatcher.on("MESSAGE_CREATE", e =>
{
    var msg = e.message;
    var text = msg.content;
    if (msg.author.id !== global.bot.User.id)
    {
        if (text[0] == "*")
        {
            if (cmd.handle_command(msg, text.substring(1), false))
            {
                if (func._can(["MANAGE_MESSAGES"], msg.channel))
                {
                    setTimeout(function(){msg.delete();}, 5000);
                }
            }
        }
        else if (func.get_client(msg.guild.id).meme)
        {
            if (func._can(["SEND_MESSAGES"], msg.channel))
            {
                cmd.handle_command(msg, text, true);
            }
        }
    }
});

function start()
{
    fs.open(token, "a+", () =>
    {
        var tok = fs.readFileSync(token, "utf-8");
        if (tok !== "")
        {
            fs.open(ytkey, "a+", () =>
            {
                global.yt_api_key = fs.readFileSync(ytkey, "utf-8");
                if (global.yt_api_key !== "")
                {
                    fs.stat(global.playlist, (err) =>
                    {
                        if (err)
                        {
                            console.log("BZZT NO PLAYLIST FOLDER BZZT\nBZZT MAKING PLAYLIST FOLDER BZZT");
                            fs.mkdirSync("playlist");
                        }
                    });
                    fs.stat(".\\data", (err) =>
                    {
                        if (err)
                        {
                            console.log("BZZT NO DATA FOLDER BZZT\nBZZT MAKING DATA FOLDER BZZT");
                            fs.mkdirSync("data");
                        }
                    });
                    global.bot.connect({token: tok});
                }
                else
                {
                    console.log("BZZT YOUTUBE API KEY EMPTY BZZT");
                }
            });
        }
        else
        {
            console.log("BZZT TOKEN EMPTY BZZT");
        }
    });
}

function sweep_clients(servers)
{
    if (servers.length === 0)
    {
        return;
    }
    var i;
    var j;
    for (i = 0; i < servers.length; i++)
    {
            var tmp = {};
            tmp.server = {id: servers[i].id, name: servers[i].name};

            var tc = global.bot.Channels.textForGuild(tmp.server.id);
            for (j = 0; j < tc.length; j++)
            {
                if (func._can(["SEND_MESSAGES"], tc[j]))
                {
                    tmp.tc = {id: tc[j].id, name: tc[j].name};
                    break;
                }
            }
            var vc = global.bot.Channels.voiceForGuild(tmp.server.id);
            for (j = 0; j < vc.length; j++)
            {
                if (func._can(["SPEAK", "CONNECT"], vc[j]))
                {
                    vc[j].join();
                    tmp.vc = {id: vc[j].id, name: vc[j].name};
                    break;
                }
            }
            global.s.push({
                server:         tmp.server,
                tc:             tmp.tc,
                vc:             tmp.vc,
                vip:            null,
                queue:          [],
                now_playing:    {},
                is_playing:     false,
                paused:         false,
                autoplay:       false,
                inform_np:      true,
                announce_auto:  true,
                encoder:        {},
                volume:         10,
                meme:           false,
                swamp:          true,
                lmao_count:     0
            });
    }
    setTimeout(function(){init(servers);}, 2000);
}

function init(servers)
{
    for (var i = 0; i < servers.length; i++)
    {
        for (var j = 0; j < global.s.length; j++)
        {
            if (servers[i].id === global.s[j].server.id && global.s[j].autoplay && global.bot.User.getVoiceChannel(global.s[j].server.id).members.length !== 1)
            {
                music.auto_queue(global.s[j]);
            }
        }
    }
    func.write_changes();
}
