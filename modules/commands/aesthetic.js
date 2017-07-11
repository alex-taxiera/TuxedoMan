module.exports = {
  command: 'aesthetic',
  description: 'make your text *a e s t h e t i c*',
  parameters: [],
  rank: 0,
  execute: function (msg, params) {
    let fullParam = params.join(' ')
    let str = ''
    for (let i = 0; i < fullParam.length; i++) {
      let result = ''
      let charCode = fullParam[i].charCodeAt()
      if (charCode < 127 && charCode !== 32) {
        result += String.fromCharCode((charCode + 65248))
      } else {
        result += fullParam[i]
      }
      str += result
      if (i !== params.length - 1) {
        str += ' '
      }
    }
    msg.channel.sendMessage(str)
  }
}
