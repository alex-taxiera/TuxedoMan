exports.up = (knex) => {
  return knex.schema.createTable('guild', (t) => {
    t.string('id').primary().notNull()
    t.string('prefix')
    t.string('vip')
  })
}

exports.down = (knex) => {
  return knex.schema.dropTable('guild')
}
