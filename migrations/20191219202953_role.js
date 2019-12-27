
exports.up = (knex) => {
  return knex.schema.createTable('role', (t) => {
    t.increments('id').primary().notNull()
    t.string('role').notNull()
    t.string('game').notNull()
    t.string('guild').notNull()
    t.string('type').notNull().defaultTo('game')
  })
}

exports.down = (knex) => {
  return knex.schema.dropTable('role')
}
