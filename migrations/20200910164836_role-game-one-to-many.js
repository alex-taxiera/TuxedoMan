exports.up = async (knex) => {
  await knex.raw('create table old_role as table role')

  const existingRoles = await knex('role')
    .select([ 'id', 'game', 'role', 'guild', 'type' ])
  const distinctRoles = await knex('role')
    .select('id')
    .distinctOn([ 'guild', 'role' ])

  await knex('role')
    .del()
    .whereNotIn(
      'id',
      distinctRoles
        .map(({ id }) => id),
    )

  await knex.schema.alterTable('role', (t) => {
    t.dropPrimary()
    t.dropColumn('id')
    t.dropColumn('game')
    t.primary([ 'guild', 'role' ])
  })

  await knex.schema.createTable('game', (t) => {
    t.increments('id').primary().notNull()
    t.string('role').notNull()
    t.string('guild').notNull()
    t.foreign([ 'guild', 'role' ])
      .references([ 'guild', 'role' ])
      .inTable('role')
      .onDelete('CASCADE')
    t.string('name').notNull()
    t.unique([ 'name', 'guild' ])
  })

  await knex('game')
    .insert(existingRoles.filter((role) => role.type === 'game').map(({
      game, role, guild,
    }) => ({
      name: game,
      role,
      guild,
    })))
}

exports.down = async (knex) => {
  await knex.schema.dropTable('game')
  await knex.schema.dropTable('role')
  await knex.raw('create table role as table old_role')
  await knex.schema.alterTable('role', (t) => {
    t.string('role').notNull().alter()
    t.string('game').notNull().alter()
    t.string('guild').notNull().alter()
    t.string('type').notNull().defaultTo('game').alter()
  })
  await knex.raw(`
    ALTER TABLE role
      ALTER COLUMN id SET NOT NULL;
    CREATE SEQUENCE role_id_seq OWNED BY role.id;
    ALTER TABLE role
      ALTER COLUMN id SET DEFAULT nextval('role_id_seq'::regclass);
    ALTER TABLE role
      ADD CONSTRAINT role_pkey PRIMARY KEY (id);
    UPDATE role SET id = nextval('role_id_seq');
  `)
  await knex.schema.dropTable('old_role')
}
