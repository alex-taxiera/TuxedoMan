const config = require('config')

const baseConfig = {
  client: config.DB_CLIENT,
  connection: {
    host: config.DB_HOST,
    database: config.DB_NAME,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
  },
}

module.exports = {
  production: {
    ...baseConfig,
    connection: {
      ...baseConfig.connection,
      user: config.ADMIN_DB_USER,
      password: config.ADMIN_DB_PASS,
    },
  },
  development: {
    ...baseConfig,
    connection: {
      ...baseConfig.connection,
      user: config.DB_USER,
      password: config.DB_PASS,
    },
  },
}
