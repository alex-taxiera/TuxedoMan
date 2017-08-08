let Command = require('../classes/Command.js')

module.exports = new Command(
  'aesthetic',
  'make your text ａｅｓｔｈｅｔｉｃ',
  [],
  'Anyone',
  function (msg, params) {
    let str = ''

    let fullParam = params.join(' ')
    for (let i = 0; i < fullParam.length; i++) {
      let charCode = fullParam[i].charCodeAt()
      if (charCode < 127 && charCode !== 32) {
        str += String.fromCharCode((charCode + 65248))
      } else {
        str += fullParam[i]
      }
    }
    msg.channel.sendMessage(str)
  }
)
