const TuxedoMan = require('./src/TuxedoMan/TuxedoMan.js')

const tables = require('./config/database.json')
const defaultSettings = require('./config/settings.json')

if (process.env.NODE_ENV !== 'production') require('dotenv').load()
const {
  TOKEN,
  DATABASE_URL,
  DB_CLIENT,
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST
} = process.env

const bot = new TuxedoMan({
  token: TOKEN,
  tables,
  sourceFolder: './src',
  defaultSettings,
  qbOptions: {
    data: {
      connectionInfo: DATABASE_URL || {
        DB_NAME,
        DB_USER,
        DB_PASS,
        DB_HOST
      },
      client: DB_CLIENT,
      pool: {
        min: 0,
        max: 10
      }
    }
  }
})

bot.connect()
