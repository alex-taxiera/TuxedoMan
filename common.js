const fs = require("fs");

module.exports =
{
    find_channel : function(type, guildId)
    {
        var i;
        if (type === "text")
        {
            var tc = global.bot.Channels.textForGuild(guildId);
            for (i = 0; i < tc.length; i++)
            {
                if (module.exports._can(["SEND_MESSAGES"], tc[i]))
                {
                    return {id: tc[i].id, name: tc[i].name};
                }
            }
            return undefined;
        }
        else if (type === "voice")
        {
            var vc = global.bot.Channels.voiceForGuild(guildId);
            for (i = 0; i < vc.length; i++)
            {
                if (module.exports._can(["SPEAK", "CONNECT"], vc[i]))
                {
                    vc[i].join();
                    return {id: vc[i].id, name: vc[i].name};
                }
            }
            return undefined;
        }
    },
    get_tc : function(client)
    {
        var text = global.bot.Channels.textForGuild(client.server.id).find(c => c.id == client.tc.id);
        if (!text || !module.exports._can(["SEND_MESSAGES"], text))
        {
            return module.exports.find_channel("text", client.server.id);
        }
        else
        {
            return text;
        }
    },
    message_handler : function(message, client)
    {
        if (message)
        {
            message.promise.then((m) =>
            {
                setTimeout(function(){m.delete();}, 10000);
            })
            .catch(() =>
            {
                var tc = module.exports.get_tc(client);
                if (tc)
                {
                    tc.sendMessage(message.content)
                    .then((m) =>
                    {
                        setTimeout(function(){m.delete();}, 10000);
                    });
                }
            });
        }
    },
    get_client : function(guildId)
    {
        return global.s.find(c => c.server.id === guildId);
    },
    _can : function(permissions, context)
    {
        for (var i = 0; i < permissions.length; i++)
        {
            if (!context)
            {
                return false;
            }
            var perm = global.bot.User.permissionsFor(context);
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
    },
    write_changes : function()
    {
        var tmp = [];
        for (var i = 0; i < global.s.length; i++)
        {
            tmp.push({
                server:         global.s[i].server,
                tc:             global.s[i].tc,
                vc:             global.s[i].vc,
                vip:            global.s[i].vip,
                autoplay:       global.s[i].autoplay,
                inform_np:      global.s[i].inform_np,
                announce_auto:  global.s[i].announce_auto,
                meme:           global.s[i].meme,
                volume:         global.s[i].volume
            });
        }
        fs.open(global.serverdata, "w+", () =>
        {
            fs.writeFileSync(global.serverdata, JSON.stringify(tmp, null, 2), "utf-8");
        });
        console.log("BZZT WROTE TO FILE BZZT");
    }
};
