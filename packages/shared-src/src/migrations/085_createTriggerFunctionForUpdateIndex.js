export async function up(query) {
  await query.sequelize.query(`
    CREATE FUNCTION set_updated_since_session()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        NEW.updated_since_session := currval('sync_session_sequence');
        RETURN NEW;
      EXCEPTION WHEN OTHERS THEN -- handle sequence not yet initialised in this session
        PERFORM setval('sync_session_sequence', (SELECT last_value FROM sync_session_sequence)); --
        NEW.updated_since_session := currval('sync_session_sequence');
        RETURN NEW;
      END
      $func$;
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP FUNCTION set_updated_since_session');
}
