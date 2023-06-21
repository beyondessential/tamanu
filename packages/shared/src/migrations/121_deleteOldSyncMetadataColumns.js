import { Sequelize } from 'sequelize';

const OLD_SYNC_METADATA_COLUMNS = {
  marked_for_push: { type: Sequelize.BOOLEAN },
  pushed_at: { type: Sequelize.DATE },
  pulled_at: { type: Sequelize.DATE },
  is_pushing: { type: Sequelize.BOOLEAN },
};
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

async function getAllTables(sequelize) {
  const [tables] = await sequelize.query(
    `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';`,
  );
  return tables.map(t => t.tablename).filter(tn => tn !== 'SequelizeMeta');
}

module.exports = {
  up: async query => {
    for (const column of Object.keys(OLD_SYNC_METADATA_COLUMNS)) {
      const tablesWithSyncMetadataColumns = await getTablesWithMetadataColumn(
        query.sequelize,
        column,
      );
      for (const table of tablesWithSyncMetadataColumns) {
        await query.removeColumn(table, column);
      }
    }
  },
  down: async query => {
    // up is destructive, so the down here is a bit dumb and just adds the metadata to all tables
    const tables = await getAllTables(query.sequelize);
    for (const [column, definition] of Object.entries(OLD_SYNC_METADATA_COLUMNS)) {
      for (const table of tables) {
        await query.addColumn(table, column, definition);
      }
    }
  },
};
