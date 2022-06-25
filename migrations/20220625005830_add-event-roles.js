exports.up = (knex) => {
  return knex.schema.createTable('eventRole', (t) => {
    t.increments('id').primary().notNull()
    t.string('guild').notNull()
    t.string('role').notNull()
    t.string('event').notNull()
  })
}

exports.down = (knex) => {
  return knex.schema.dropTable('eventRole')
}
