import { QueryTypes, type Sequelize } from 'sequelize';
import type { Migration } from 'umzug';
import type { PreMigrationDbSnapshot } from './gatherPreMigrationDbSnapshot';

export type MigrationLogStats = {
  /** Duration (ms) per migration file in this batch. */
  durationMsPerMigration: Record<string, number>;
  /** Sum of all values in durationMsPerMigration. */
  sumDurationMsPerMigration: number;
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
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'logs'
      AND table_name = 'migrations';
    `,
    {
      type: QueryTypes.SELECT,
    },
  );
  if (!tableExists) return;

  const migrationFiles = JSON.stringify(migrations.map((migration: Migration) => migration.file));

  /** Ensure migrations table has the extended columns (batch_duration_ms, upgrade_run_id, stats). */
  const [hasExtendedColumns] = await sequelize.query(
    `
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'logs'
      AND table_name = 'migrations'
      AND column_name = 'stats'
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
