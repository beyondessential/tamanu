export async function up(query) {
  await query.sequelize.query(`
    CREATE FUNCTION set_updated_at_sync_index()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        SELECT last_value FROM sync_session_sequence INTO NEW.updated_at_sync_index;
        RETURN NEW;
      END
      $func$;
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP FUNCTION set_updated_at_sync_index');
}
