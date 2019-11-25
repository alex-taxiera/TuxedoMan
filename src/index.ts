import { join } from 'path'

import {
  SQLManager
} from 'eris-boiler'

import TuxedoMan from './modules/tuxedoman'

const {
  DISCORD_TOKEN,
  TS_DB_CLIENT,
  TS_DB_NAME,
  TS_DB_USER,
  TS_DB_PASS,
  TS_DB_HOST
} = process.env

/* create DataClient instance */
const bot = new TuxedoMan(DISCORD_TOKEN, {
  databaseManager: new SQLManager({
    connectionInfo: {
      database: TS_DB_NAME,
      user: TS_DB_USER,
      password: TS_DB_PASS,
      host: TS_DB_HOST
    },
    client: TS_DB_CLIENT
  })
})

bot
  .addCommands(join(__dirname, 'commands')) // load commands in commands folder
  .addEvents(join(__dirname, 'events'))
  .connect()                                // login to discord
  .then(() => {
    console.log(bot)
  })
