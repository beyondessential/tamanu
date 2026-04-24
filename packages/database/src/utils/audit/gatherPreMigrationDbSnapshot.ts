import { QueryTypes, type Sequelize } from 'sequelize';

/** From pg_database_size; **-1** if the size could not be read (do not treat as a real byte count). */
const DATABASE_SIZE_UNKNOWN = -1;

/** Max tables with a non-negative reltuples estimate (planner has a row count to report). */
const TABLE_ROW_ESTIMATE_LIMIT = 500;

export type TableRowEstimateEntry = {
  tableName: string;
  /** From pg_class.reltuples (approximate). */
  estimatedRowCount: number;
};

export type PreMigrationDbSnapshot = {
  /** From pg_database_size; **-1** if the size could not be read (do not treat as a real byte count). */
  databaseSizeBytes: number;
  /**
   * Largest tables first by planner row estimate (`reltuples` DESC).
   * Stored as an array so order is preserved in JSONB.
   * Tables with no estimate yet (`reltuples < 0`, common before ANALYZE) are omitted.
   */
  tableRowEstimates: TableRowEstimateEntry[];
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
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.reltuples >= 0
      ORDER BY c.reltuples DESC
      LIMIT ${TABLE_ROW_ESTIMATE_LIMIT}
    `,
    { type: QueryTypes.SELECT },
  );

  const tableRowEstimates: TableRowEstimateEntry[] = [];
  for (const row of rows) {
    const estimatedRowCount = Number(row.estimated_row_count);
    if (!Number.isFinite(estimatedRowCount) || estimatedRowCount < 0) {
      continue;
    }
    tableRowEstimates.push({
      tableName: row.table_name,
      estimatedRowCount,
    });
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

/** Best-effort snapshot for audit logs; logs a warning and returns undefined on failure. */
export async function tryGatherPreMigrationDbSnapshot(
  log: { warn: (message: string, error: unknown) => void },
  sequelize: Sequelize,
): Promise<PreMigrationDbSnapshot | undefined> {
  try {
    return await gatherPreMigrationDbSnapshot(sequelize);
  } catch (err) {
    log.warn('Could not gather pre-migration DB snapshot for audit log', err);
    return undefined;
  }
}
