import type { QueryInterface } from 'sequelize';

const TABLES = ['local_system_facts', 'local_system_secrets'] as const;

/**
 * `key` uniqueness was already enforced by unique indexes, but a unique constraint is more
 * semantically correct. That PostgreSQL backs it with a unique index is an implementation detail.
 */
export async function up(query: QueryInterface): Promise<void> {
  for (const table of TABLES) {
    // Think of this as ‘add constraint if not exists’
    await query.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = '${table}_key_key'
            AND conrelid = '${table}'::regclass
        ) THEN
          ALTER TABLE ${table}
            ADD CONSTRAINT ${table}_key_key UNIQUE (key);
        END IF;
      END $$;
    `);
    await query.sequelize.query(`DROP INDEX IF EXISTS ${table}_key;`);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const table of TABLES) {
    await query.sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS ${table}_key ON ${table} (key);`,
    );
    await query.sequelize.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${table}_key_key;`);
  }
}
