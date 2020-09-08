const up = (t) => {
  t.boolean('manageVoice').notNull().defaultTo(true)
  t.string('voiceChannelCategory').defaultTo(null)
  t.integer('voiceChannelThreshold').notNull().defaultTo(1)
  t.integer('voiceChannelLimit').defaultTo(null)
}

const down = (t) => {
  t.dropColumn('manageVoice')
  t.dropColumn('voiceChannelCategory')
  t.dropColumn('voiceChannelThreshold')
  t.dropColumn('voiceChannelLimit')
}

exports.up = async (knex) => {
  await knex.schema.table('guild', up)
  await knex.schema.table('role', up)
}

exports.down = async (knex) => {
  await knex.schema.table('guild', down)
  await knex.schema.table('role', down)
}
