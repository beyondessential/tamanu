import { INTEGER } from 'sequelize';

async function getAllTables(sequelize) {
  const [tables] = await sequelize.query(
    `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';`,
  );
  return tables.map(t => t.tablename).filter(tn => tn !== 'SequelizeMeta');
}

module.exports = {
  up: async query => {
    const syncingTables = await getAllTables(query.sequelize);
    for (const table of syncingTables) {
      // add the updated_at_sync_tick column
      await query.addColumn(table, 'updated_at_sync_tick', {
        type: INTEGER,
      });

      // fill it with some initial values
      await query.sequelize.query(`
        UPDATE ${table} SET updated_at_sync_tick = 0;
      `);

      // add a not null constraint
      await query.sequelize.query(`
        ALTER TABLE ${table} ALTER COLUMN updated_at_sync_tick SET NOT NULL;
      `);

      // before insert or update, set updated_at (overriding any that is passed in)
      await query.sequelize.query(`
        CREATE TRIGGER set_${table}_updated_at_sync_tick
        BEFORE INSERT OR UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at_sync_tick();
      `);
    }
  },
  down: async query => {
    const syncingTables = await getAllTables(query.sequelize);
    for (const table of syncingTables) {
      await query.sequelize.query(`
        DROP TRIGGER IF EXISTS set_${table}_updated_at_sync_tick ON ${table};
      `);
      await query.removeColumn(table, 'updated_at_sync_tick');
    }
  },
};
