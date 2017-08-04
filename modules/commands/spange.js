const Command = require('../classes/Command.js')

module.exports = new Command(
  'spange',
  'MaKe yOur tExT sPanGe',
  [],
  'Anyone',
  false,
  function (msg, params) {
    let fullParam = params.join(' ').toLowerCase()
    let str = ''
    let charCode = ''
    let rng
    let indices = []

    for (let i = 0; i < (fullParam.length * 0.33); i++) {
      do {
        rng = Math.floor(Math.random() * (fullParam.length - 1 - 0 + 1)) + 0
        charCode = fullParam[rng].charCodeAt()
      } while (charCode > 122 || charCode < 97 || indices.includes(rng) ||
      indices.includes((rng + 1)) || indices.includes((rng - 1)))

      indices.push(rng)
    }

    for (let i = 0; i < fullParam.length; i++) {
      if (indices.includes(i)) {
        charCode = fullParam[i].charCodeAt()
        str += String.fromCharCode((charCode - 32))
      } else {
        str += fullParam[i]
      }
    }
    msg.channel.uploadFile('./images/spange.jpg', null, str)
  }
)
