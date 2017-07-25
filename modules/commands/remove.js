const db = require('../database.js')
const Command = require('./command.js')
const Response = require('../response.js')

module.exports = new Command(
  'remove',
  'Removes a song from the queue',
  ["Request index or 'last'"],
  'VIP',
  false,
  function (msg, params) {
    let str = ''
    let index = params[0]
    let client = db.getGuildInfo(msg.guild.id)

    if (index === 'last') {
      index = client.queue.length
    }
    index = parseInt(index)

    if (client.queue.length === 0) {
      str = 'The queue is empty'
    } else if (isNaN(index)) {
      str = `Argument "${index}" is not a valid index.`
    } else if (index < 1 || index > client.queue.length) {
      str = `Cannot remove request #${index} from the queue (there are only ${client.queue.length} requests currently)`
    } else {
      let deleted = client.queue.splice(index - 1, 1)
      str = `Request "${deleted[0].title}" was removed from the queue.`
    }
    return new Response(msg, str)
  }
)
