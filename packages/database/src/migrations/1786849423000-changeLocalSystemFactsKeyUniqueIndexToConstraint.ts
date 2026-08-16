import type { QueryInterface } from 'sequelize';

/**
 * Uniqueness of `local_system_facts.key` was already enforced by unique index, but a unique
 * constraint is more semantically correct. That PostgreSQL backs it with a unique index is an
 * implementation detail internal to it.
 */
export async function up(query: QueryInterface): Promise<void> {
  // This of this as ‘add constraint if not exists’
  await query.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'local_system_facts_key_key'
          AND conrelid = 'local_system_facts'::regclass
      ) THEN
        ALTER TABLE local_system_facts
          ADD CONSTRAINT local_system_facts_key_key UNIQUE (key);
      END IF;
    END $$;
  `);
  await query.sequelize.query('DROP INDEX IF EXISTS local_system_facts_key;');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS local_system_facts_key ON local_system_facts (key);',
  );
  await query.sequelize.query(
    'ALTER TABLE local_system_facts DROP CONSTRAINT IF EXISTS local_system_facts_key_key;',
  );
}
