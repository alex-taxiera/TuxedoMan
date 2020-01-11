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

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const {
  TUX_DISCORD_TOKEN,
  TUX_DB_CLIENT,
  TUX_DB_NAME,
  TUX_DB_USER,
  TUX_DB_PASS,
  TUX_DB_HOST,
  TUX_DB_CONNECTION
} = (process.env as unknown) as ENV

/* create DataClient instance */
const bot = new TuxedoMan(TUX_DISCORD_TOKEN, {
  oratorOptions,
  statusManagerOptions,
  databaseManager: new SQLManager({
    connectionInfo: TUX_DB_CONNECTION || {
      database: TUX_DB_NAME,
      user: TUX_DB_USER,
      password: TUX_DB_PASS,
      host: TUX_DB_HOST
    },
    client: TUX_DB_CLIENT
  })
})

bot
  .addCommands(join(__dirname, 'commands'))
  .addSettingCommands(join(__dirname, 'settings'))
  .addEvents(join(__dirname, 'events'))
  .connect()
