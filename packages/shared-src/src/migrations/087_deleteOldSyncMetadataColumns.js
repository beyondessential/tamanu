const OLD_SYNC_METADATA_COLUMNS = ['marked_for_push', 'pushed_at', 'pulled_at', 'is_pushing'];
async function getTablesWithMetadataColumn(sequelize, column) {
  const [tables] = await sequelize.query(
    `SELECT
      typname
    FROM
      pg_catalog.pg_attribute
    JOIN
      pg_catalog.pg_type
    ON
      pg_attribute.attrelid = pg_type.typrelid
    WHERE
      attname = '${column}';`,
  );
  return tables.map(t => t.typname).filter(tn => tn !== 'SequelizeMeta');
}

module.exports = {
  up: async query => {
    for (const column of OLD_SYNC_METADATA_COLUMNS) {
      const tablesWithSyncMetadataColumns = await getTablesWithMetadataColumn(
        query.sequelize,
        column,
      );
      for (const table of tablesWithSyncMetadataColumns) {
        await query.removeColumn(table, column);
      }
    }
  },
  down: async () => {
    // up is destructive, not much point in writing a down here
  },
};
