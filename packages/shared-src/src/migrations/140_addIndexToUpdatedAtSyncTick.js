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
      await query.addIndex(table, ['updated_at_sync_tick']);
    }
  },
  down: async query => {
    const syncingTables = await getAllTables(query.sequelize);
    for (const table of syncingTables) {
      await query.removeIndex(table, ['updated_at_sync_tick']);
    }
  },
};
