import { QueryTypes, type Sequelize } from 'sequelize';
import __cjs_umzug from 'umzug';
const { Migration } = __cjs_umzug;
import type { PreMigrationDbSnapshot } from './gatherPreMigrationDbSnapshot';

export type MigrationLogStats = {
  /** Duration (ms) per migration file in this batch. */
  durationMsPerMigration: Record<string, number>;
  /** Total ms spent inside migration scripts in this batch (sum of durationMsPerMigration). */
  totalMigrationsDurationMs: number;
  /** Snapshot of the database before the migration batch was applied. */
  preSnapshot?: PreMigrationDbSnapshot;
};

export type CreateMigrationAuditLogOptions = {
  batchDurationMs?: number;
  upgradeRunId?: string;
  stats?: MigrationLogStats;
};

export const createMigrationAuditLog = async (
  sequelize: Sequelize,
  migrations: Migration[],
  direction: 'up' | 'down',
  options: CreateMigrationAuditLogOptions = {},
) => {
  const [tableExists] = await sequelize.query(
    `
      SELECT 1 AS one
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'logs'
        AND c.relname = 'migrations'
        AND c.relkind = 'r'
      LIMIT 1
    `,
    {
      type: QueryTypes.SELECT,
    },
  );
  if (!tableExists) return;

  const migrationFiles = JSON.stringify(migrations.map((migration: Migration) => migration.file));

  /** Back-compat: extended columns exist only after addMigrationBatchStatsToMigrationLogs. */
  const [hasExtendedColumns] = await sequelize.query(
    `
      SELECT 1 AS one
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
      WHERE n.nspname = 'logs'
        AND c.relname = 'migrations'
        AND c.relkind = 'r'
        AND a.attname = 'stats'
        AND a.attnum > 0
        AND NOT a.attisdropped
      LIMIT 1
    `,
    {
      type: QueryTypes.SELECT,
    },
  );

  if (!hasExtendedColumns) {
    await sequelize.query(
      `
        INSERT INTO logs.migrations (direction, migrations)
        VALUES ($1, $2);
      `,
      {
        type: QueryTypes.INSERT,
        bind: [direction, migrationFiles],
      },
    );
    return;
  }

  const { batchDurationMs, upgradeRunId, stats } = options;

  await sequelize.query(
    `
      INSERT INTO logs.migrations (
        direction,
        migrations,
        batch_duration_ms,
        upgrade_run_id,
        stats
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5
        );
    `,
    {
      type: QueryTypes.INSERT,
      bind: [
        direction,
        migrationFiles,
        batchDurationMs ?? null,
        upgradeRunId ?? null,
        stats ? JSON.stringify(stats) : null,
      ],
    },
  );
};
