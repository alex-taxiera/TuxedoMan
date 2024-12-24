import { join } from 'path'

import config from 'config'
import {
  DataClient,
} from 'eris-boiler'
import * as logger from '@util/logger'

import * as Sentry from '@sentry/node'
import '@sentry/tracing'

const SENTRY_TRACE_SAMPLE_RATE = 1.0

if (config.get('NODE_ENV') === 'production') {
  Sentry.init({
    dsn: config.get('SENTRY_DSN'),
    environment: config.get('NODE_ENV'),
    release: config.get('BUILD_NUMBER'),
    tracesSampleRate: SENTRY_TRACE_SAMPLE_RATE,
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
  // databaseManager: new SQLManager({
  //   connectionInfo: {
  //     database: config.get('DB_NAME'),
  //     user: config.has('DB_USER') ? config.get('DB_USER') : '',
  //     password: config.has('DB_PASS') ? config.get('DB_PASS') : '',
  //     host: config.has('DB_HOST') ? config.get('DB_HOST') : '',
  //   },
  //   client: config.get('DB_CLIENT'),
  //   pool: {
  //     min: 0,
  //   },
  // }),
})

bot
  .addCommands(join(__dirname, 'commands'))
  .addSettingCommands(join(__dirname, 'settings'))
  .addEvents(join(__dirname, 'events'))
  .connect()
  .catch(logger.error)
