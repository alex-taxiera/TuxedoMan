module.exports = {
  command: 'spange',
  description: 'MaKe yOur tExT sPanGe',
  parameters: [],
  rank: 2,
  execute: function (msg, params) {
    let fullParam = params.join(' ')
    let str = ''
    let charCode = ''
    let rng
    let indices = []
    for (let i = 0; i < (fullParam.length * 0.4); i++) {
      do {
        rng = Math.floor(Math.random() * (fullParam.length - 1 - 0 + 1)) + 0
        charCode = fullParam[rng].charCodeAt()
      } while (charCode > 122 || charCode < 97 || indices.includes(rng) || indices.includes((rng + 1)))
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
    msg.channel.uploadFile('./images/spange.jpg', null, str) // , str
  }
}
