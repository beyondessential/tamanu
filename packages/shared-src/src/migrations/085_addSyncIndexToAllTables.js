import { INTEGER, literal } from 'sequelize';

const NON_SYNCING_TABLES = [
  'SequelizeMeta',
  'appointments',
  'attachments',
  'local_system_facts',
  'one_time_logins',
  'patient_communications',
  'patient_vrs_data',
  'settings',
  'signers',
  'sync_cursors',
  'user_localisation_caches',
];

async function getSyncingTables(sequelize) {
  const [tables] = await sequelize.query(
    `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';`,
  );
  return tables.map(t => t.tablename).filter(tn => !NON_SYNCING_TABLES.includes(tn));
}

module.exports = {
  up: async query => {
    const syncingTables = await getSyncingTables(query.sequelize);
    for (const table of syncingTables) {
      await query.addColumn(table, 'sync_index', {
        type: INTEGER,
        allowNull: false,
        defaultValue: literal(`currval('sync_index_sequence')`),
      });
    }
  },
  down: async query => {
    const syncingTables = await getSyncingTables(query.sequelize);
    for (const table of syncingTables) {
      await query.removeColumn(table, 'sync_index');
    }
  },
};
