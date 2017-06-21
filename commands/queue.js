const func = require('../common.js')
module.exports = {
  command: 'queue',
  description: 'Displays the queue',
  parameters: [],
  rank: 0,
  execute: function (msg) {
    var client = func.getClient(msg.guild.id)
    var str = ''
    if (client.queue.length === 0) {
      str = 'the queue is empty.'
    } else {
      for (var i = 0; i < client.queue.length; i++) {
                // 17 because the "and more" string is 17 characters long before the number is added
                // the remaining videos in queue can never be more than max queue, so compare against max queue to be safe
        if (str.length + 17 + client.queue.length.toString().length + client.queue[i].title.length + client.queue[i].user.username.length < 2000) {
          str += `"${client.queue[i].title}" (requested by ${client.queue[i].user.username}) `
        } else {
          str += `\n**...and ${(client.queue.length - i - 1)} more.**`
          break
        }
      }
    }
    return {promise: msg.reply(str), content: str}
  }
}
