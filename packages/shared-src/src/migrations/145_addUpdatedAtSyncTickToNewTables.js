// NOTE ABOUT IMPORTING CONFIG IN THIS MIGRATION
// Generally you shouldn't import things into migrations, because then you rely on that import
// keeping a stable API
// We import config here in a departure from that rule of thumb, but please don't copy blindly:
// - It's probably not okay to use config if the schema is altered (not the case here, only data)
// - Consider the case when the config you're using were to go missing - would this be ok for the
//   migration? (here, a missing serverFacilityId will set the sync tick to 0, which won't matter
//   if there is no data, as is the case if this is run in future on a new server by the time we
//   remove serverFacilityId from the config)
import config from 'config';
// End of antipattern
import { BIGINT } from 'sequelize';

async function getNewTables(sequelize) {
  const [tables] = await sequelize.query(`
    SELECT
      pg_class.relname
    FROM
      pg_catalog.pg_class
    JOIN
      pg_catalog.pg_namespace
    ON
      pg_class.relnamespace = pg_namespace.oid
    LEFT JOIN
      pg_catalog.pg_attribute
    ON
      pg_attribute.attrelid = pg_class.oid
    AND
      pg_attribute.attname = 'updated_at_sync_tick'
    WHERE
      pg_namespace.nspname = 'public'
    AND
      pg_class.relkind = 'r'
    AND
      pg_attribute.attname IS NULL;
  `);
  return tables
    .map(t => t.relname)
    .filter(tn => tn !== 'SequelizeMeta' && tn !== 'sync_session_records');
}

module.exports = {
  up: async query => {
    const syncingTables = await getNewTables(query.sequelize);
    for (const table of syncingTables) {
      // add the updated_at_sync_tick column
      await query.addColumn(table, 'updated_at_sync_tick', {
        type: BIGINT,
        defaultValue: -999,
      });

      // fill it with some initial values, either -999 so that it is not marked for sync on facility
      // server, or 0 on the central server so that it is caught in any initial sync of a facility
      const initialValue = config.serverFacilityId ? -999 : 0;
      await query.sequelize.query(`
        UPDATE ${table} SET updated_at_sync_tick = ${initialValue};
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
    const syncingTables = await getNewTables(query.sequelize);
    for (const table of syncingTables) {
      await query.sequelize.query(`
        DROP TRIGGER IF EXISTS set_${table}_updated_at_sync_tick ON ${table};
      `);
      await query.removeColumn(table, 'updated_at_sync_tick');
    }
  },
};
