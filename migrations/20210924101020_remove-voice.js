const settingsUp = (t) => {
  t.dropColumn('manageVoice')
  t.dropColumn('voiceChannelCategory')
  t.dropColumn('voiceChannelThreshold')
  t.dropColumn('voiceChannelLimit')
}

exports.up = async function (knex) {
  await knex.schema.alterTable('guild', settingsUp)
  await knex.schema.alterTable('role', settingsUp)
  return knex.schema.dropTable('room')
}

exports.down = async function (knex) {
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

  return knex.schema.createTable('room', (t) => {
    t.increments('id').primary().notNull()
    t.string('guild').notNull()
    t.string('role').notNull()
    t.string('channel')
  })
}
