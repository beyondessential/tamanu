import { INTEGER } from 'sequelize';

module.exports = {
  up: async query => {
    await query.sequelize.query(`
      DROP TRIGGER IF EXISTS set_sync_session_records_updated_at_sync_tick
      ON sync_session_records;
    `);
    await query.removeColumn('sync_session_records', 'updated_at_sync_tick');
  },
  down: async query => {
    // add the updated_at_sync_tick column
    await query.addColumn('sync_session_records', 'updated_at_sync_tick', {
      type: INTEGER,
    });

    // fill it with some initial values
    await query.sequelize.query(`
      UPDATE 'sync_session_records' SET updated_at_sync_tick = 0;
    `);

    // add a not null constraint
    await query.sequelize.query(`
      ALTER TABLE 'sync_session_records' ALTER COLUMN updated_at_sync_tick SET NOT NULL;
    `);

    // before insert or update, set updated_at (overriding any that is passed in)
    await query.sequelize.query(`
      CREATE TRIGGER set_sync_session_records_updated_at_sync_tick
      BEFORE INSERT OR UPDATE ON sync_session_records
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at_sync_tick();
    `);
  },
};
