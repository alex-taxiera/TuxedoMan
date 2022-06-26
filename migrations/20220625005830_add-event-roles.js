exports.up = async (knex) => {
  await knex.schema.createTable('eventRole', (t) => {
    t.increments('id').primary().notNull()
    t.string('guild').notNull()
    t.string('role').notNull()
    t.string('event').notNull()
  })

  await knex.schema.alterTable('guild', (t) => {
    t.boolean('events').notNull().defaultTo(false)
    t.boolean('events').notNull().defaultTo(true).alter()
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('eventRole')
  await knex.schema.alterTable('guild', (t) => {
    t.dropColumn('events')
  })
}
