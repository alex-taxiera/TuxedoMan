# TuxedoMan
A presence based role manager. (Now with Event roles!)
# How can I get TuxedoMan in my server?
Click this [link](https://discordapp.com/api/oauth2/authorize?client_id=441366628836442122&permissions=268443648&scope=bot)
# What does it do?
TuxedoMan sorts your member list based on their current activity.

![Role Example](/images/role_example.png)

_Watching and Listening roles not pictured_
# How does it work?
Use a simple command to tell TuxedoMan what games he should make and assign roles for `track Overwatch`
Note: If your game has a space in the name, you need to use `track "Star Citizen"`

Disable or enable the optional categories `settings game/watch/listen/stream`

Managed roles should be sorted in order you wish members to be sorted.

Roles must be __UNDER__ TuxedoMan role.

![Role Hierarchy](/images/role_hierarchy.png)

_Example role hierarchy_

# Tell me about events?
Enable the events system with `settings events`

The bot will then create roles for any and all events made in the server.
Anyone who "joins" the event by selecting "Interested" will then be given that role.
The role is mentionable by default.
