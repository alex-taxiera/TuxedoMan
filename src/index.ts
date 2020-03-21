import { join } from 'path'

import {
  SQLManager
} from 'eris-boiler'

import { TuxedoMan } from './modules/tuxedoman'
import {
  oratorOptions,
  statusManagerOptions
} from './config'
import { ENV } from './types/env'

if (process.env.NODE_ENV === 'production') {
  require('docker-secret-env').load()
} else {
  require('dotenv').config()
}

const {
  DISCORD_TOKEN,
  DB_CLIENT,
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST
} = (process.env as unknown) as ENV

/* create DataClient instance */
const bot = new TuxedoMan(DISCORD_TOKEN, {
  oratorOptions,
  statusManagerOptions,
  databaseManager: new SQLManager({
    connectionInfo: {
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASS,
      host: DB_HOST
    },
    client: DB_CLIENT,
    pool: {
      min: 0
    }
  })
})

bot
  .addCommands(join(__dirname, 'commands'))
  .addSettingCommands(join(__dirname, 'settings'))
  .addEvents(join(__dirname, 'events'))
  .connect()
