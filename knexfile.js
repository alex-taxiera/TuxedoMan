require('dotenv').config()
const {
  NODE_ENV,
  TS_DB_CLIENT,
  TS_DB_NAME,
  TS_DB_USER,
  TS_DB_PASS
} = process.env

module.exports = {
  [NODE_ENV]: {
    client: TS_DB_CLIENT,
    connection: {
      database: TS_DB_NAME,
      user: TS_DB_USER,
      password: TS_DB_PASS
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

console.log(module.exports)
