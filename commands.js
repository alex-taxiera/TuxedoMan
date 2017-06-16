var music = require("./music.js");
var func = require("./common.js");

module.exports =
{
    handle_command : function(msg, text, meme)
    {
        var command = "";
        if (!meme)
        {
            var client = func.get_client(msg.guild.id);
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
                        func.message_handler(command.execute(msg, params), client);
                    }
                    else if (rank(msg) < command.rank)
                    {
                        func.message_handler(deny_rank(msg, command.rank));
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
};

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

function deny_rank(msg, rank)
{
    var str = "";
    if (rank === 1)
    {
        str = `Must be in voice chat with ${global.bot.User.username}`;
        return {promise: msg.reply(str), content: str};
    }
    else if (rank === 2)
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
    var client = func.get_client(msg.guild.id);
    if (msg.guild.isOwner(msg.member))
    {
        return 3;
    }
    else if (client.vip && msg.member.hasRole(client.vip))
    {
        return 2;
    }
    else if (global.bot.User.getVoiceChannel(client.server.id).members.findIndex(m => m.id === msg.member.id) !== -1)
    {
        return 1;
    }
    else
    {
        return 0;
    }
}

function check_game(client, role)
{
    var i;
    var guild = global.bot.Guilds.toArray().find(g => g.id === client.server.id);
    if (client.game_roles.roles.find(r => r.id === role.id))
    {
        for (i = 0; i < guild.member_count; i++)
        {
            if (guild.members[i].gameName === role.name)
            {
                console.log(`BZZT ASSIGNING ${guild.members[i].name.toUpperCase()} ${role.name.toUpperCase()} BZZT`);
                guild.members[i].assignRole(role).catch(function(e){console.log(`BZZT CANNOT ASSIGN ROLE BZZT\n${e}`);});
            }
        }
    }
    else
    {
        for (i = 0; i < guild.member_count; i++)
        {
            if (guild.members[i].hasRole(role))
            {
                console.log(`BZZT UNASSIGNING ${guild.members[i].name.toUpperCase()} ${role.name.toUpperCase()} BZZT`);
                guild.members[i].unassignRole(role).catch(function(e){console.log(`BZZT CANNOT UNASSIGN ROLE BZZT\n${e}`);});
            }
        }
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
            if (params[1]/2 > 0 && params[1]/2 <= 100)
            {
                var client = func.get_client(msg.guild.id);
                if (params[1]/2 === client.volume)
                {
                    str = "Volume is already at that level!";
                    return {promise: msg.reply(str), content: str};
                }
                else
                {
                    music.volume(client, params[1]/2);
                    str = "Volume set!";
                    return {promise: msg.reply(str), content: str};
                }
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
            var client = func.get_client(msg.guild.id);
            var str = "";
            if (!client.is_playing && client.queue.length === 0)
            {
                if (client.autoplay)
                {
                    client.paused = false;
                    music.auto_queue(client);
                    str = "Starting!";
                    return {promise: msg.reply(str), content: str};
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
            var client = func.get_client(msg.guild.id);
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
            var client = func.get_client(msg.guild.id);
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
            var client = func.get_client(msg.guild.id);
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
                return music.queue_playlist(match[2], msg);
            }
            else
            {
                console.log(`BZZT REQUEST VIDEO ON ${func.get_client(msg.guild.id).server.name.toUpperCase()} BZZT`);
                return music.add_to_queue(params[1], msg);
            }
        }
    },
    // search
    {
        command: "search",
        description: "Searches for a video or playlist on YouTube and adds it to the queue",
        parameters: ["query"],
        rank: 1,
        execute: function(msg, params)
        {
            var q = "";
            for (var i = 1; i < params.length; i++)
            {
                q += params[i] + " ";
            }
            console.log(`BZZT SEARCH VIDEO ON ${func.get_client(msg.guild.id).server.name.toUpperCase()} BZZT`);
            return music.search_video(msg, q);
        }
    },
    // np
    {
        command: "np",
        description: "Displays the current song",
        parameters: [],
        rank: 0,
        execute: function(msg)
        {
            var client = func.get_client(msg.guild.id);
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
        rank: 0,
        execute: function(msg)
        {
            var client = func.get_client(msg.guild.id);
            var str = "";
            if(client.queue.length === 0)
            {
                str = "the queue is empty.";
            }
            else
            {
                for (var i = 0; i < client.queue.length; i++)
                {
                    // 17 because the "and more" string is 17 characters long before the number is added
                    // the remaining videos in queue can never be more than max queue, so compare against max queue to be safe
                    if (str.length + 17 + client.queue.length.toString().length + client.queue[i].title.length + client.queue[i].user.username.length < 2000)
                    {
                        str += `"${client.queue[i].title}" (requested by ${client.queue[i].user.username}) `;
                    }
                    else
                    {
                        str += `\n**...and ${(client.queue.length - i - 1)} more.**`;
                        break;
                    }
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
        rank: 0,
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
            msg.member.openDM()
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
            var client = func.get_client(msg.guild.id);
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
            var client = func.get_client(msg.guild.id);
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
            var client = func.get_client(msg.guild.id);
            var str = "";
            client.inform_np = !client.inform_np;
            func.write_changes();
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
            var client = func.get_client(msg.guild.id);
            var str = "";
            client.announce_auto = !client.announce_auto;
            func.write_changes();
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
            var client = func.get_client(msg.guild.id);
            var str = "";
            client.autoplay = !client.autoplay;
            if (client.autoplay && global.bot.User.getVoiceChannel(msg.guild).members.length !== 1)
            {
                client.paused = false;
                music.auto_queue(client);
            }
            func.write_changes();
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
            var client = func.get_client(msg.guild.id);
            var str = "";
            client.meme = !client.meme;
            func.write_changes();
            str = `Meme posting set to ${client.meme}!`;
            return {promise: msg.reply(str), content: str};
        }
    },
    //toggle game roles
    {
        command: "gameroletoggle",
        description: "Toggle game roles",
        parameters: [],
        rank: 2,
        execute: function(msg)
        {
            var client = func.get_client(msg.guild.id);
            var str = "";
            client.game_roles.active = !client.game_roles.active;
            str = `Game roles set to ${client.game_roles.active}!`;
            func.write_changes();
            func.sweep_games(client);
            return {promise: msg.reply(str), content: str};
        }
    },
    //add game roles
    {
        command: "addgamerole",
        description: "Add game roles",
        parameters: ["existing role name, role should be the same as the name of the game as it appears on discord"],
        rank: 2,
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
            var client = func.get_client(msg.guild.id);
            var str = "";
            var role = msg.guild.roles.find(r => r.name === full_param);
            if (role)
            {
                if (!client.game_roles.roles.find(r => r === role.id))
                {
                    client.game_roles.roles.push(role.id);
                    str = `Added "${full_param}" to game roles!`;
                    check_game(client, role);
                    func.write_changes();
                    return {promise: msg.reply(str), content: str};
                }
                else
                {
                    str = `"${full_param}" not in list!`;
                    return {promise: msg.reply(str), content: str};
                }
            }
            else
            {
                str = `"${full_param}" does not exist in this server!`;
                return {promise: msg.reply(str), content: str};
            }
        }
    },
    //delete game roles
    {
        command: "delgamerole",
        description: "Add game roles",
        parameters: ["role name"],
        rank: 2,
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
            var client = func.get_client(msg.guild.id);
            var str = "";
            var role = msg.guild.roles.find(r => r.name === full_param);
            if (role)
            {
                var index = client.game_roles.roles.findIndex(r => r === role.id);
                if (index !== -1)
                {
                    client.game_roles.roles.splice(index, 1);
                    str = `Deleted "${full_param}" from game roles!`;
                    check_game(client, role);
                    func.write_changes();
                    return {promise: msg.reply(str), content: str};
                }
                else
                {
                    str = `"${full_param}" not in list!`;
                    return {promise: msg.reply(str), content: str};
                }
            }
            else
            {
                str = `"${full_param}" does not exist in this server!`;
                return {promise: msg.reply(str), content: str};
            }
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
            var client = func.get_client(msg.guild.id);
            var str = "";
            var vc = global.bot.Channels.voiceForGuild(msg.guild);
            for (var j = 0; j < vc.length; j++)
            {
                if (params[1] === vc[j].name)
                {
                    if (client.vc.id !== vc[j].id)
                    {
                        if (func._can(["CONNECT"], vc[j]))
                        {
                            if (func._can(["SPEAK"], vc[j]))
                            {
                                client.vc = {id: vc[j].id, name: vc[j].name};
                                func.write_changes();
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
            var client = func.get_client(msg.guild.id);
            var str = "";

            var tc = global.bot.Channels.textForGuild(msg.guild);
            for (var j = 0; j < tc.length; j++)
            {
                if (params[1] === tc[j].name)
                {
                    if (client.tc.id !== tc[j].id)
                    {
                        if (func._can(["SEND_MESSAGES"], tc[j]))
                        {
                            client.tc = {id: tc[j].id, name: tc[j].name};
                            func.write_changes();
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
            var client = func.get_client(msg.guild.id);
            var guild = global.bot.Guilds.toArray().find(g => g.id === client.server.id);
            var vip_role = "";
            var game_roles = "";
            var role;
            if (client.vip)
            {
                role = guild.roles.find(r => r.id === client.vip);
                vip_role = role.name;
            }
            else
            {
                vip_role = "None";
            }
            if (client.game_roles.active)
            {
                game_roles += "True\n";
            }
            else
            {
                game_roles += "False\n";
            }
            for (var i = 0; i < client.game_roles.roles.length; i++)
            {
                role = guild.roles.find(r => r.id === client.game_roles.roles[i]);
                if (role)
                {
                    if (i)
                    {
                        game_roles += " ";
                    }
                    game_roles += `"${role.name}"`;
                }
            }
            var str = "Preferences";
            var embed =
            {
                color: 0x3498db,
                fields: [{name: "Default Text Channel", value: client.tc.name},
                {name: "Default Voice Channel", value: client.vc.name},
                {name: "VIP Role", value: vip_role},
                {name: "Autoplay", value: client.autoplay},
                {name: "Announce Now Playing", value: client.inform_np},
                {name: "Announce Now Playing from Autoplay", value: client.announce_auto},
                {name: "Memes", value: client.meme},
                {name: "Music Volume", value: `${client.volume}%`},
                {name: "Game Roles", value: game_roles}]
            };
            return {promise: msg.reply(str, false, embed), content: str, delay: 25000, embed: embed};
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
            var client = func.get_client(msg.guild.id);
            var str = "";
            for (var j = 0; j < msg.guild.roles.length; j++)
            {
                if (full_param === msg.guild.roles[j].name)
                {
                    if (msg.guild.roles[j].id !== client.vip)
                    {
                        client.vip = msg.guild.roles[j].id;
                        func.write_changes();
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
            var client = get_client(msg.guild.id);
            if (client.server.isOwner(msg.member))
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
            var client = func.get_client(msg.guild.id);
            //MEME HELL DO NOT GO BELOW

            //DVA EXAMPLE
            if (text.includes(" dva ") || text === "dva")
            {
                msg.channel.uploadFile("./images/kek.png");
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
                msg.channel.uploadFile("./images/baby.gif", "./images/baby.gif");
            }
            //ban
            if (text.includes(" ban ") || text === "ban")
            {
                msg.channel.uploadFile("./images/ban.jpg");
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
                msg.channel.uploadFile("./images/underboob.jpg");
            }
            //bruh
            if (text === "bruh")
            {
                msg.channel.uploadFile("./images/bruh.jpg");
            }
            //bye
            if (text.includes(" bye ") || text === "bye")
            {
                msg.channel.uploadFile("./images/bye.gif", "./images/bye.gif");
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
                msg.channel.uploadFile("./images/dilligaf.png");
            }
            //doyoueven
            if (text.includes(" doyoueven ") || text === "doyoueven" || text.includes("do you even ") || text === "do you even")
            {
                msg.channel.uploadFile("./images/doyoueven.jpg");
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
                msg.channel.uploadFile("./images/highfive.jpg");
            }
            //hue
            if (text.includes("hue"))
            {
                msg.channel.sendMessage("HUE+HUE+HUE+HUE+HUE+HUE+HUE+HUE+");
            }
            //ignis
            if (text.includes("ignis"))
            {
                msg.channel.uploadFile("./images/ignis.gif", "./images/ignis.gif");
            }
            //iwata
            if (text.includes("iwata"))
            {
                msg.channel.uploadFile("./images/iwata.jpg");
            }
            //jon
            if (text.includes(" jon ") || text === "jon")
            {
                msg.channel.uploadFile("./images/jon.gif", "./images/jon.gif");
            }
            //left
            if (text.includes(" left ") || text === "left")
            {
                msg.channel.uploadFile("./images/left.jpg");
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
                msg.channel.uploadFile("./images/mao.jpg");
            }
            //minarah
            if (text.includes("minarah"))
            {
                msg.channel.sendMessage("Minarah Dark Blade the Black Rose, she grew up a bandit, a warrior, was trained as an assassin. She's had a hard life. She's *not* a hero. <@119963118016266241>");
            }
            //miyamoto
            if (text.includes("miyamoto"))
            {
                msg.channel.uploadFile("./images/miyamoto.gif", "./images/miyamoto.gif");
            }
            //myswamp
            if (text.includes("swamp"))
            {
                if (client.swamp)
                {
                    client.swamp = false;
                    msg.channel.uploadFile("./images/swamp1.png");
                }
                else
                {
                    client.swamp = true;
                    msg.channel.uploadFile("./images/swamp2.png");
                }
            }
            //nebby
            if (text.includes("nebby"))
            {
                msg.channel.uploadFile("./images/nebby.gif", "./images/nebby.gif");
            }
            //pedo
            if (text.includes("pedo"))
            {
                msg.channel.uploadFile("./images/pedo.png");
            }
            //pepe
            if (text.includes(" pepe ") || text === "pepe")
            {
                msg.channel.sendMessage("*FUCKING PEPE,THAT SCUM ON MY BALLSACK!. FUCK THAT BUNDLE OF STICKS SHOVING UP HIS ASS HAVING 'I LIVE WITH MY MOM' JORDAN 3'S WEARING MOTHERHUGGER! THAT SOUTHERN, 'I CHEATED ON MY SISTER WITH MY MOTHER' COUNTRY ASS MOTHERHUGGER. BUT YEAH, FUCK HIM...*");
            }
            //petyr
            if (text.includes("petyr"))
            {
                msg.channel.uploadFile("./images/petyr.jpeg");
            }
            //pls
            if (text.includes("please the team") || text.includes("pleasetheteam") || text === "pls")
            {
                msg.channel.uploadFile("./images/pls.gif", "./images/pls.gif").then((m) =>
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
                msg.channel.uploadFile("./images/payload.gif", "./images/payload.gif");
            }
            //snorlax
            if (text.includes("snorlax"))
            {
                msg.channel.uploadFile("./images/snorlax.gif", "./images/snorlax.gif");
            }
            //sonicno
            if (text.includes("sonicno") || text.includes("sonic no"))
            {
                msg.channel.uploadFile("./images/sonicno.jpg");
            }
            //spookyshit
            if (text.includes("spookyshit") || text.includes("spooky shit"))
            {
                msg.channel.sendMessage("🎃👻🎃👻🎃👻👻👻🎃👻 spooky shit spooky sHit🎃 thats ✔ some spooky🎃🎃shit right🎃🎃th 🎃 ere🎃🎃🎃 right✔there ✔✔if i do ƽaү so my selｆ 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 🎃🎃 🎃НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ🎃 🎃 🎃 🎃 💯 🎃 👻👻 👻 🎃🎃spooky shit 🎃👻🎃👻🎃👻👻👻🎃👻 spooky shit spooky sHit🎃 thats ✔ some spooky🎃🎃shit right🎃🎃th 🎃 ere🎃🎃🎃 right✔there ✔✔if i do ƽaү so my selｆ 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 🎃🎃 🎃НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ🎃 🎃 🎃 🎃 💯 🎃 👻👻 👻 🎃🎃spooky shit");
            }
            //tbc
            if (text.includes("tbc") || text.includes("tobecontinued") || text.includes("to be continued"))
            {
                msg.channel.uploadFile("./images/tbc.png");
            }
            //valor
            if (text.includes("valor"))
            {
                msg.channel.uploadFile("./images/valor.png");
            }
            //who
            if (text.includes("who are th") || text === "who")
            {
                msg.channel.uploadFile("./images/people.gif", "./images/people.gif");
            }
            //womb
            if (text.includes("womb"))
            {
                msg.channel.uploadFile("./images/womb.gif", "./images/womb.gif");
            }
        }
    }
];
