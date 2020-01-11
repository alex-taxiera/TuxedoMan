exports.up = (knex) => {
  return knex.schema.table('guild', (t) => {
    t.boolean('game').notNull().defaultTo(true)
    t.boolean('stream').notNull().defaultTo(true)
    t.boolean('listen').notNull().defaultTo(true)
    t.boolean('watch').notNull().defaultTo(true)
  })
}

exports.down = (knex) => {
  return knex.schema.table('guild', function (t) {
    t.dropColumn('game')
    t.dropColumn('stream')
    t.dropColumn('listen')
    t.dropColumn('watch')
  })
}
