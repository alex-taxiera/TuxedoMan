import { join } from 'path'

import {
  SQLManager
} from 'eris-boiler'

import { TuxedoMan } from './modules/tuxedoman'
import { ENV } from './types/env'
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const {
  DISCORD_TOKEN,
  TS_DB_CLIENT,
  TS_DB_NAME,
  TS_DB_USER,
  TS_DB_PASS,
  TS_DB_HOST
} = (process.env as unknown) as ENV

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
  .addCommands(join(__dirname, 'commands'))
  .addEvents(join(__dirname, 'events'))
  .connect()
