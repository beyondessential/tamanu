import { QueryTypes, type Sequelize } from 'sequelize';
import type { Migration } from 'umzug';

import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';

export const createMigrationAuditLog = async (
  sequelize: Sequelize,
  migrations: Migration[],
  direction: 'up' | 'down',
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
  await sequelize.query(
    `
      INSERT INTO logs.migrations (logged_at, direction, migrations, record_sync_tick)
      VALUES (
        CURRENT_TIMESTAMP,
        $1,
        $2,
        (
          SELECT value::bigint AS current_sync_tick
          FROM local_system_facts
          WHERE key = '${FACT_CURRENT_SYNC_TICK}'
        )
      );
    `,
    {
      type: QueryTypes.INSERT,
      bind: [direction, migrations.map((migration: Migration) => migration.file).join(',')],
    },
  );
};
