import { join } from 'path'

import config from 'config'
import {
  SQLManager,
} from 'eris-boiler'
import { logger } from 'eris-boiler/util'

import { TuxedoMan } from './modules/tuxedoman'

const bot = new TuxedoMan(config.get('DISCORD_TOKEN'), {
  oratorOptions: config.get('oratorOptions'),
  statusManagerOptions: config.get('statusManagerOptions'),
  databaseManager: new SQLManager({
    connectionInfo: {
      database: config.get('DB_NAME'),
      user: config.has('DB_USER') ? config.get('DB_USER') : '',
      password: config.has('DB_PASS') ? config.get('DB_PASS') : '',
      host: config.has('DB_HOST') ? config.get('DB_HOST') : '',
    },
    client: config.get('DB_CLIENT'),
    pool: {
      min: 0,
    },
  }),
})

bot
  .addCommands(join(__dirname, 'commands'))
  .addSettingCommands(join(__dirname, 'settings'))
  .addEvents(join(__dirname, 'events'))
  .connect()
  .catch(logger.error)
