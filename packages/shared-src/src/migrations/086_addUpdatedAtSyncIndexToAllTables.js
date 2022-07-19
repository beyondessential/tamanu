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
      // add the updated_at_sync_index column
      await query.addColumn(table, 'updated_at_sync_index', {
        type: INTEGER,
      });

      // fill it with some initial values
      await query.sequelize.query(`
        UPDATE ${table} SET updated_at_sync_index = 0;
      `);

      // add a not null constraint
      await query.sequelize.query(`
        ALTER TABLE ${table} ALTER COLUMN updated_at_sync_index SET NOT NULL;
      `);

      // before insert, set updated_at if not provided
      await query.sequelize.query(`
        CREATE TRIGGER set_${table}_updated_at_sync_index_on_insert
        BEFORE INSERT ON ${table}
        FOR EACH ROW
        WHEN (NEW.updated_at_sync_index IS NULL) -- i.e. when an override value has not been passed in
        EXECUTE FUNCTION set_updated_at_sync_index();
      `);

      // before updates, set updated_at if not provided or unchanged
      await query.sequelize.query(`
        CREATE TRIGGER set_${table}_updated_at_sync_index_on_update
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        WHEN (NEW.updated_at_sync_index IS NULL OR NEW.updated_at_sync_index = OLD.updated_at_sync_index) -- i.e. when an override value has not been passed in
        EXECUTE FUNCTION set_updated_at_sync_index();
      `);
    }
  },
  down: async query => {
    const syncingTables = await getAllTables(query.sequelize);
    for (const table of syncingTables) {
      await query.sequelize.query(`
        DROP TRIGGER set_${table}_updated_at_sync_index_on_insert ON ${table};
      `);
      await query.sequelize.query(`
        DROP TRIGGER set_${table}_updated_at_sync_index_on_update ON ${table};
      `);
      await query.removeColumn(table, 'updated_at_sync_index');
    }
  },
};
