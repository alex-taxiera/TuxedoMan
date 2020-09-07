exports.up = (knex) => {
  return knex.schema.table('guild', (t) => {
    t.boolean('manageVoice').notNull().defaultTo(true)
    t.integer('voiceChannelThreshold').notNull().defaultTo(1)
    t.string('voiceChannelCategory').defaultTo(null)
  })
}

exports.down = (knex) => {
  return knex.schema.table('guild', function (t) {
    t.dropColumn('manageVoice')
    t.dropColumn('voiceChannelThreshold')
    t.dropColumn('voiceChannelCategory')
  })
}