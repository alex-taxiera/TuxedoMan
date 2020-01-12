if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const {
  NODE_ENV,
  TUX_DB_CLIENT,
  TUX_DB_NAME,
  TUX_DB_USER,
  TUX_DB_PASS,
  TUX_DB_HOST,
  TUX_DB_CONNECTION
} = process.env

module.exports = {
  [NODE_ENV]: {
    client: TUX_DB_CLIENT,
    connection: TUX_DB_CONNECTION || {
      host: TUX_DB_HOST,
      database: TUX_DB_NAME,
      user: TUX_DB_USER,
      password: TUX_DB_PASS
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
}
