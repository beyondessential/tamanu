export async function up(query) {
  await query.sequelize.query(`
    CREATE FUNCTION set_updated_at_index()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        NEW.updated_at_index := currval('sync_index_sequence');
        RETURN NEW;
      EXCEPTION WHEN OTHERS THEN -- handle sequence not yet initialised in this session
        PERFORM setval('sync_index_sequence', (SELECT last_value FROM sync_index_sequence)); --
        NEW.updated_at_index := currval('sync_index_sequence');
        RETURN NEW;
      END
      $func$;
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP FUNCTION set_updated_at_index');
}
