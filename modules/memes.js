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
  // ayya
  if (text.includes(' ayya ') || text === 'ayya') {
    msg.channel.createMessage('AYYA AYYA AYYA')
  }
  // panda
  if (text.includes(' panda ') || text === 'panda') {
    msg.channel.createMessage('Panda\nPanda\nPanda\nPanda\nPanda')
  }
  // stain
  if (text.includes(' stain ') || text === 'stain') {
    msg.channel.createMessage('STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN STAIN')
  }
  // baby
  if (text.includes(' baby ') || text === 'baby') {
    sendFile(msg.channel, 'baby.gif')
  }
  // ban
  if (text.includes(' ban ') || text === 'ban') {
    sendFile(msg.channel, 'ban.jpg')
  }
  // bb
  if (text.includes(' bb ') || text === 'bb') {
    msg.channel.createMessage('Big Brother is watching™')
  }
  // blueberry
  if (text.includes(' blueberry pie ') || text === 'blueberry pie') {
    msg.channel.createMessage('BLUEBERRY FUCKING PIE? WHAT KIND OF FILTHY, ' +
    'UNWASHED, DEGENERATES DECIDED TO COME UP WITH THIS SHIT. FIRST YOU GIVE ' +
    'PEOPLE THE POWER TO DICTATE THEIR CREAM FILLING, NOW YOU\'RE LETTING THEM ' +
    'CONDENSE A HOME COOKED PASTRY INTO A BITE SIZED CRUMPET SHIT? REALLY? FUCKING ' +
    'REALLY? I AM GOING TO FIND WHEVER MADE THIS ONLY TO DISEMBOWLE THEM, INFLATE ' +
    'THEIR ORGANS AND SHOVE THEM BACK INSIDE, SO THAT THEIR BODY RESEMBLES THE ' +
    'BLUEBERRY GIRL IN CHARLIE AND THE CHOCOLA-FUCKING-TE FACTA-FUCKING-ORY. THAT\'S ' +
    'RIGHT. THAT\'S WHO CREATED THIS. IT\'S EVIL AND I SHALL HAVE NO PART OF IT. IF ' +
    'YOU HAVE A CONCIENSE, OR ANY SEMPLENCE OF A SOUL, YOU WILL THROW THOSE AWAY, OR ' +
    'BETTER YET, BURN THEM AND SPREAD THEIR ASHES THOROUGHLY INTO A VENUS FLYTRAP ' +
    'FLOWERBED. THAT IS ALL.')
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
  // danganroppa
  if (text.includes('danganroppa')) {
    msg.channel.createMessage('Dangit Wrongpan?')
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
  // dozicus
  if (text.includes('dozicus')) {
    msg.channel.createMessage('DozicusPrimeTheDestroyerOfWorldsFredButtonIdiot' +
    'MushroomBurger Stormborn of house targaryen, first of her name, queen of ' +
    'the andals and first men, khaleesi, mother of dragons and breaker of chains.')
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
  // jon
  if (text.includes(' jon ') || text === 'jon') {
    sendFile(msg.channel, 'jon.gif')
  }
  // kevin
  if (text.includes('birthday')) {
    msg.channel.createMessage('HAPPY BIRTHDAY <@119963118016266241>')
  }
  // left
  if (text.includes(' left ') || text === 'left') {
    sendFile(msg.channel, 'left.jpg')
  }
  // lmao
  if (text.includes('lmao')) {
    client.lmaoCount++
    if (client.lmaoCount % 20 === 0) {
      msg.channel.createMessage('What the ayy did you just fucking lmao about ' +
      'me, you ayy lmao? I\'ll have you know I graduated top of my ayy in ' +
      'the Lmaos, and I\'ve been involved in numerous Lmao\'s on Ayyl-Quaeda' +
      ', and I have over 300 confirmed lmaos. I am trained in ayy lmao and ' +
      'I\'m the top ayy in the entire US lmao. You are nothing to me but just ' +
      'another ayy. I will ayy you the fuck lmao with ayy the likes of which ' +
      'has never been seen lmao\'d on this Earth, mark my ayy lmao. You think ' +
      'you can get away with ayying that lmao to me over the Internet? Think ' +
      'again, fucker. As we voiceSpeak I am ayying my secret network of lmaos ' +
      'across the USA and your ayy is being traced right now so you better ' +
      'prepare for the lmao, maggot. The lmao that ayys out the pathetic little ' +
      'thing you call your lmao. You\'re ayy lmao, kid. I can ayy anywhere, ' +
      'anytime, and I can lmao you in over seven hundred ways, and that\'s ' +
      'just with my bare lmao. Not only am I extensively trained in ayy lmao' +
      ', but I have access to the entire ayy of the United States Lmao and I ' +
      'will use it to its full extent to ayy your miserable lmao off the face ' +
      'of the continent, you little shit. If only you could have known what ' +
      'unholy ayy your little “clever” lmao was about to bring down upon you' +
      ', maybe you would have held your fucking ayy. But you couldn’t, you ' +
      'didn’t, and now you’re ayying the lmao, you goddamn idiot. I will ayy ' +
      'lmao all over you and you will ayy in it. You’re fucking lmao, kiddo')
    }
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
  // pls
  if (text.includes('please the team') || text.includes('pleasetheteam') || text === 'pls') {
    sendFile(msg.channel, 'pls.gif', 30000)
  }
  // poopkink
  if (text.includes('poopkink')) {
    msg.channel.createMessage('http://www.poopkink.com')
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
