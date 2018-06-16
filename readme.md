# TuxedoMan
A presence based role manager.
# How can I get TuxedoMan in my server?
Click this [link](https://discordapp.com/api/oauth2/authorize?client_id=441366628836442122&permissions=268443648&scope=bot)
# What does it do?
TuxedoMan sorts your member list based on their current activity.

![Role Example](/images/role_example.png)

_Watching and Listening roles not pictured_
# How does it work?
Use a simple command to tell TuxedoMan what games he should make and assign roles for `!track Overwatch`

Disable or enable the optional categories `!enable/!disable game/watch/listen/stream`

Managed roles should be sorted in order you wish members to be sorted.

Roles must be __UNDER__ TuxedoMan role.

![Role Hierarchy](/images/role_hierarchy.png)

_Example role hierarchy_
# Self Hosting
Self hosting is possible, but not recommended.
## Startup
1. Clone this repository
2. Create a `config.json` file inside of `src` (use `sample.config.json` as a guide)
3. Run `npm install`
4. Run `npm start`

## Customization
Choose whether or not to randomly change playing status in `/src/config.json`

Add new playing statuses with `!status add Overwatch`
