const Meme = require('./classes/Meme.js')
const { common } = require('./')
const images = './data/images/'
const fs = require('fs')

let memeMap = new Map()

function sendFile (channel, name, delay) {
  fs.readFile(`${images}${name}`, (err, file) => {
    if (err) {
      common.log('error reading file', 'red', err)
    } else {
      const image = { file, name }
      let msg = channel.createMessage('', image)
      if (delay) {
        setTimeout(() => {
          Promise.resolve(msg)
          .then((m) => {
            m.delete()
          })
        }, delay)
      }
    }
  })
}

module.exports = function (msg, text) {
  let id = msg.channel.guild.id
  if (!memeMap.get(id)) {
    memeMap.set(id, new Meme())
  }

  let client = memeMap.get(id)
  text = text.toLowerCase()
  // DVA EXAMPLE
  if (text.includes(' dva ') || text === 'dva') {
    sendFile(msg.channel, 'kek.png')
  }
  // baby
  if (text.includes(' baby ') || text === 'baby') {
    sendFile(msg.channel, 'baby.gif')
  }
  // ban
  if (text.includes(' ban ') || text === 'ban') {
    sendFile(msg.channel, 'ban.jpg')
  }
  // boob
  if (text.includes(' boob ') || text === 'boob') {
    sendFile(msg.channel, 'underboob.jpg')
  }
  // bruh
  if (text === 'bruh') {
    sendFile(msg.channel, 'bruh.jpg')
  }
  // bye
  if (text.includes(' bye ') || text === 'bye') {
    sendFile(msg.channel, 'bye.gif')
  }
  // daddy
  if (text.includes(' daddy ') || text === 'daddy') {
    msg.channel.createMessage('<@192158164798406658>')
  }
  // debbie
  if (text.includes('debbie')) {
    msg.channel.createMessage('WHAT WILL DEBBIE THINK!')
  }
  // dilligaf
  if (text.includes('dilligaf')) {
    sendFile(msg.channel, 'dilligaf.png')
  }
  // doyoueven
  if (text.includes(' doyoueven') || text === 'doyoueven' || text.includes('do you even ') || text === 'do you even') {
    sendFile(msg.channel, 'doyoueven.jpg')
  }
  // embargo
  if (text.includes('embargo')) {
    msg.channel.createMessage('But now, Gwilith was dead. His world had turned ' +
    'into his worst enemy, and now the only thing he knew was the wind. This was ' +
    'the beginning of Embargo. This was the beginning of the end. <@185936558036090880>')
  }
  // gg
  if (text.includes(' gg ') || text === 'gg') {
    msg.channel.createMessage('<:golduck:250425534427824128> ***GIT GUD*** ' +
    '<:golduck:250425534427824128>\n<:golduck:250425534427824128> ' +
    '***GIT GUD*** <:golduck:250425534427824128>\n<:golduck:250425534427824128> ' +
    '***GIT GUD*** <:golduck:250425534427824128>\n<:golduck:250425534427824128> ' +
    '***GIT GUD*** <:golduck:250425534427824128>\n<:golduck:250425534427824128> ' +
    '***GIT GUD*** <:golduck:250425534427824128>')
  }
  // goodshit
  if (text.includes('goodshit') || text.includes('good shit')) {
    msg.channel.createMessage('👌👀👌👀👌👀👌👀👌👀 good shit go౦ԁ sHit👌 thats ' +
    '✔ some good👌👌shit right👌👌th 👌 ere👌👌👌 right✔there ✔✔if i do ƽaү ' +
    'so my selｆ 💯 i say so 💯 thats what im talking about right there right ' +
    'there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 👌👌 👌НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ' +
    '👌 👌👌 👌 💯 👌 👀 👀 👀 👌👌Good shit')
  }
  // highfive
  if (text.includes('highfive') || text.includes('high five')) {
    sendFile(msg.channel, 'highfive.jpg')
  }
  // hue
  if (text.includes('hue')) {
    msg.channel.createMessage('HUE+HUE+HUE+HUE+HUE+HUE+HUE+HUE+')
  }
  // ignis
  if (text.includes('ignis')) {
    sendFile(msg.channel, 'ignis.gif')
  }
  // iwata
  if (text.includes('iwata')) {
    sendFile(msg.channel, 'iwata.jpg')
  }
  // kevin
  if (text.includes('birthday')) {
    msg.channel.createMessage('HAPPY BIRTHDAY <@119963118016266241>')
  }
  // left
  if (text.includes(' left ') || text === 'left') {
    sendFile(msg.channel, 'left.jpg')
  }
  // mao
  if (text.includes(' mao ') || text === 'mao') {
    sendFile(msg.channel, 'mao.jpg')
  }
  // minarah
  if (text.includes('minarah')) {
    msg.channel.createMessage('Minarah Dark Blade the Black Rose, she grew up ' +
    'a bandit, a warrior, was trained as an assassin. She\'s had a hard life. ' +
    'She\'s *not* a hero. <@119963118016266241>')
  }
  // miyamoto
  if (text.includes('miyamoto')) {
    sendFile(msg.channel, 'miyamoto.gif')
  }
  // myswamp
  if (text.includes('swamp')) {
    if (client.swamp) {
      client.swamp = false
      sendFile(msg.channel, 'swamp1.png')
    } else {
      client.swamp = true
      sendFile(msg.channel, 'swamp2.png')
    }
  }
  // nebby
  if (text.includes('nebby')) {
    sendFile(msg.channel, 'nebby.gif')
  }
  // pedo
  if (text.includes('pedo')) {
    sendFile(msg.channel, 'pedo.png')
  }
  // pepe
  if (text.includes(' pepe ') || text === 'pepe') {
    msg.channel.createMessage('*FUCKING PEPE,THAT SCUM ON MY BALLSACK!. FUCK ' +
    'THAT BUNDLE OF STICKS SHOVING UP HIS ASS HAVING "I LIVE WITH MY MOM" ' +
    'JORDAN 3\'S WEARING MOTHERHUGGER! THAT SOUTHERN, "I CHEATED ON MY SISTER ' +
    'WITH MY MOTHER" COUNTRY ASS MOTHERHUGGER. BUT YEAH, FUCK HIM...*')
  }
  // petyr
  if (text.includes('petyr')) {
    sendFile(msg.channel, 'petyr.jpeg')
  }
  // pushthepayload
  if (text.includes('payload')) {
    sendFile(msg.channel, 'payload.gif')
  }
  // snorlax
  if (text.includes('snorlax')) {
    sendFile(msg.channel, 'snorlax.gif')
  }
  // sonicno
  if (text.includes('sonicno') || text.includes('sonic no')) {
    sendFile(msg.channel, 'sonicno.jpg')
  }
  // spookyshit
  if (text.includes('spookyshit') || text.includes('spooky shit')) {
    msg.channel.createMessage('🎃👻🎃👻🎃👻👻👻🎃👻 spooky shit spooky ' +
    'sHit🎃 thats ✔ some spooky🎃🎃shit right🎃🎃th 🎃 ere🎃🎃🎃 right✔' +
    'there ✔✔if i do ƽaү so my selｆ 💯 i say so 💯 thats what im talking ' +
    'about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 🎃🎃 🎃' +
    'НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ🎃 🎃 🎃 🎃 💯 🎃 👻👻 👻 🎃🎃spooky ' +
    'shit 🎃👻🎃👻🎃👻👻👻🎃👻 spooky shit spooky sHit🎃 thats ✔ some ' +
    'spooky🎃🎃shit right🎃🎃th 🎃 ere🎃🎃🎃 right✔there ✔✔if i do ƽaү ' +
    'so my selｆ 💯 i say so 💯 thats what im talking about right there right ' +
    'there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 🎃🎃 🎃НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒ' +
    'ᵒᵒᵒᵒ🎃 🎃 🎃 🎃 💯 🎃 👻👻 👻 🎃🎃spooky shit')
  }
  // tbc
  if (text.includes('tbc') || text.includes('tobecontinued') || text.includes('to be continued')) {
    sendFile(msg.channel, 'tbc.png')
  }
  // trap
  if (text.includes(' trap ') || text.includes('trap!') || text === 'trap') {
    sendFile(msg.channel, 'micno.jpg')
  }
  // valor
  if (text.includes('valor')) {
    sendFile(msg.channel, 'valor.png')
  }
  // who
  if (text.includes('who are th') || text === 'who') {
    sendFile(msg.channel, 'people.gif')
  }
  // womb
  if (text.includes('womb')) {
    sendFile(msg.channel, 'womb.gif')
  }
}
