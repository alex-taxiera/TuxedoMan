const down = (t) => {
  t.dropColumn('manageVoice')
  t.dropColumn('voiceChannelCategory')
  t.dropColumn('voiceChannelThreshold')
  t.dropColumn('voiceChannelLimit')
}

exports.up = async (knex) => {
  await knex.schema.alterTable('guild', (t) => {
    t.boolean('manageVoice').notNull().defaultTo(true)
    t.string('voiceChannelCategory')
    t.integer('voiceChannelThreshold')
    t.integer('voiceChannelLimit')
  })
  await knex.schema.alterTable('role', (t) => {
    t.boolean('manageVoice')
    t.string('voiceChannelCategory')
    t.integer('voiceChannelThreshold')
    t.integer('voiceChannelLimit')
  })

  await knex('guild').update({
    manageVoice: false,
  }).where(true)
}

exports.down = async (knex) => {
  await knex.schema.alterTable('guild', down)
  await knex.schema.alterTable('role', down)
}
