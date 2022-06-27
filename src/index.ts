import { join } from 'path'

import config from 'config'
import {
  DataClient,
  SQLManager,
} from 'eris-boiler'
import * as logger from '@util/logger'

import * as Sentry from '@sentry/node'

if (config.get('NODE_ENV') === 'production') {
  Sentry.init({
    dsn: config.get('SENTRY_DSN'),
    environment: config.get('NODE_ENV'),
    release: config.get('BUILD_NUMBER'),

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  })
}

const bot = new DataClient(config.get('DISCORD_TOKEN'), {
  erisOptions: {
    restMode: true,
    intents: [
      'guilds',
      'guildPresences',
      'guildScheduledEvents',
      'guildMembers',
      'guildMessages', // deprecated for application commands
    ],
  },
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
