import { INTEGER, literal } from 'sequelize';

async function getSyncingTables(sequelize) {
  const [tables] = await sequelize.query(
    `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';`,
  );
  return tables.map(t => t.tablename).filter(tn => tn !== 'SequelizeMeta');
}

module.exports = {
  up: async query => {
    const syncingTables = await getSyncingTables(query.sequelize);
    for (const table of syncingTables) {
      // add the updated at beat column
      await query.addColumn(table, 'updated_at_beat', {
        type: INTEGER,
      });

      // fill it with some initial values
      await query.sequelize.query(`
        UPDATE ${table} SET updated_at_beat = 0;
      `);

      // add a not null constraint
      await query.sequelize.query(`
        ALTER TABLE ${table} ALTER COLUMN updated_at_beat SET NOT NULL;
      `);

      // before insert, set updated_at if not provided
      await query.sequelize.query(`
        CREATE TRIGGER set_${table}_updated_at_beat_on_insert
        BEFORE INSERT ON ${table}
        FOR EACH ROW
        WHEN (NEW.updated_at_beat IS NULL) -- i.e. when an override value has not been passed in
        EXECUTE FUNCTION set_updated_at_beat();
      `);

      // before updates, set updated_at if not provided or unchanged
      await query.sequelize.query(`
        CREATE TRIGGER set_${table}_updated_at_beat_on_update
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        WHEN (NEW.updated_at_beat IS NULL OR NEW.updated_at_beat = OLD.updated_at_beat) -- i.e. when an override value has not been passed in
        EXECUTE FUNCTION set_updated_at_beat();
      `);
    }
  },
  down: async query => {
    const syncingTables = await getSyncingTables(query.sequelize);
    for (const table of syncingTables) {
      await query.removeColumn(table, 'sync_beat');
      await query.sequelize.query(`
        DROP TRIGGER set_${table}_updated_at_beat_on_insert ON ${table};
      `);
      await query.sequelize.query(`
        DROP TRIGGER set_${table}_updated_at_beat_on_update ON ${table};
      `);
    }
  },
};
