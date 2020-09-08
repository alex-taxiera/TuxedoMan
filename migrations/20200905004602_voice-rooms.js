exports.up = (knex) => {
  return knex.schema.createTable('room', (t) => {
    t.increments('id').primary().notNull()
    t.string('guild').notNull()
    t.string('role').notNull()
    t.string('channel')
  })
}

exports.down = (knex) => {
  return knex.schema.dropTable('room')
}
