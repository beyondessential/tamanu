import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { createTestContext } from '../utilities';

describe('Self-referencing foreign keys on syncable tables must be DEFERRABLE', () => {
  let ctx;
  let models;
  let sequelize;

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
  });

  afterAll(() => ctx.close());

  it('all self-referencing FKs on syncable tables in the public schema are deferrable', async () => {
    const syncableTables = Object.values(models)
      .filter(
        m =>
          m.tableName &&
          m.usesPublicSchema &&
          m.syncDirection &&
          m.syncDirection !== SYNC_DIRECTIONS.DO_NOT_SYNC,
      )
      .map(m => m.tableName);

    if (syncableTables.length === 0) {
      throw new Error('No syncable tables found — check test setup');
    }

    const [selfRefFks] = await sequelize.query(`
      SELECT
        con.conname AS constraint_name,
        cl.relname AS table_name,
        a.attname AS column_name,
        con.condeferrable AS is_deferrable,
        con.condeferred AS is_initially_deferred
      FROM pg_constraint con
      JOIN pg_class cl ON con.conrelid = cl.oid
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
      JOIN pg_namespace n ON cl.relnamespace = n.oid
      WHERE con.contype = 'f'
        AND con.conrelid = con.confrelid
        AND n.nspname = 'public'
        AND cl.relname IN (:syncableTables)
    `, { replacements: { syncableTables } });

    const invalid = selfRefFks.filter(fk => !fk.is_deferrable || fk.is_initially_deferred);

    if (invalid.length > 0) {
      const details = invalid
        .map(fk => `  ${fk.table_name}.${fk.column_name} (${fk.constraint_name})`)
        .join('\n');
      throw new Error(
        `Self-referencing foreign keys on syncable tables must be DEFERRABLE INITIALLY IMMEDIATE.\n` +
        `The following are not:\n${details}\n\n` +
        `Add a migration with: ALTER TABLE <table> DROP CONSTRAINT <constraint>;\n` +
        `ALTER TABLE <table> ADD CONSTRAINT <constraint> FOREIGN KEY (<column>) REFERENCES <table>(id) DEFERRABLE INITIALLY IMMEDIATE;`,
      );
    }
  });
});
