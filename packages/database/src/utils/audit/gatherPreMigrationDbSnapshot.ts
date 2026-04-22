import { QueryTypes, type Sequelize } from 'sequelize';

/** From pg_database_size; **-1** if the size could not be read (do not treat as a real byte count). */
const DATABASE_SIZE_UNKNOWN = -1;

export type PreMigrationDbSnapshot = {
  /** From pg_database_size; **-1** if the size could not be read (do not treat as a real byte count). */
  databaseSizeBytes: number;
  tableRowEstimates: Record<string, number>;
};

/**
 * Fast, approximate snapshot using pg stats (reltuples) and database size.
 * reltuples accuracy depends on ANALYZE; use for trend / coarse sizing only.
 */
export async function gatherPreMigrationDbSnapshot(
  sequelize: Sequelize,
): Promise<PreMigrationDbSnapshot> {
  const [sizeRow] = await sequelize.query<{ bytes: string }>(
    `SELECT pg_database_size(current_database())::text AS bytes`,
    { type: QueryTypes.SELECT },
  );

  const rows = await sequelize.query<{
    table_name: string;
    estimated_row_count: string;
  }>(
    `
      SELECT c.relname AS table_name, c.reltuples::bigint::text AS estimated_row_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.reltuples DESC
    `,
    { type: QueryTypes.SELECT },
  );

  const tableRowEstimates: Record<string, number> = {};
  for (const row of rows) {
    tableRowEstimates[row.table_name] = Number(row.estimated_row_count);
  }

  let databaseSizeBytes = DATABASE_SIZE_UNKNOWN;
  if (sizeRow) {
    const n = Number(sizeRow.bytes);
    databaseSizeBytes = Number.isFinite(n) ? n : DATABASE_SIZE_UNKNOWN;
  }

  return {
    databaseSizeBytes,
    tableRowEstimates,
  };
}
