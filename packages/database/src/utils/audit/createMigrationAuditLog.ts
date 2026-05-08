import { QueryTypes, type Sequelize } from 'sequelize';
import type { Migration } from 'umzug';

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
      INSERT INTO logs.migrations (direction, migrations)
      VALUES (
        $1,
        $2
        );
    `,
    {
      type: QueryTypes.INSERT,
      bind: [direction, JSON.stringify(migrations.map((migration: Migration) => migration.file))],
    },
  );
};
