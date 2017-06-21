const func = require('../common.js')
module.exports = {
  command: 'remove',
  description: 'Removes a song from the queue',
  parameters: ["Request index or 'last'"],
  rank: 2,
  execute: function (msg, params) {
    var index = params[1]
    var client = func.getClient(msg.guild.id)
    var str = ''
    if (client.queue.length === 0) {
      str = 'The queue is empty'
      return {promise: msg.reply(str), content: str}
    } else if (isNaN(index) && index !== 'last') {
      str = `Argument "${index}" is not a valid index.`
      return {promise: msg.reply(str), content: str}
    }

    if (index === 'last') { index = client.queue.length }
    index = parseInt(index)
    if (index < 1 || index > client.queue.length) {
      str = `Cannot remove request #${index} from the queue (there are only ${client.queue.length} requests currently)`
      return {promise: msg.reply(str), content: str}
    }

    var deleted = client.queue.splice(index - 1, 1)
    str = `Request "${deleted[0].title}" was removed from the queue.`
    return {promise: msg.reply(str), content: str}
  }
}
