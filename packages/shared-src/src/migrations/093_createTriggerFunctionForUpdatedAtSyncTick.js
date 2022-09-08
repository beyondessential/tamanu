export async function up(query) {
  await query.sequelize.query(`
    CREATE FUNCTION set_updated_at_sync_tick()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        SELECT last_value FROM sync_clock_sequence INTO NEW.updated_at_sync_tick;
        RETURN NEW;
      END
      $func$;
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP FUNCTION set_updated_at_sync_tick');
}
