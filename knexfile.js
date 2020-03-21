if (process.env.NODE_ENV === 'production') {
  require('docker-secret-env').load()
} else {
  require('dotenv').config()
}

const {
  DB_CLIENT,
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST,
  ADMIN_DB_USER,
  ADMIN_DB_PASS
} = process.env

const baseConfig = {
  client: DB_CLIENT,
  connection: {
    host: DB_HOST,
    database: DB_NAME
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations'
  }
}

module.exports = {
  production: {
    ...baseConfig,
    connection: {
      ...baseConfig.connection,
      user: ADMIN_DB_USER,
      password: ADMIN_DB_PASS
    }
  },
  development: {
    ...baseConfig,
    connection: {
      ...baseConfig.connection,
      user: DB_USER,
      password: DB_PASS
    }
  }
}
