import { QueryTypes } from 'sequelize';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { closeDatabase, createTestDatabase } from '../utilities';

// Every synced table stamps created_at/updated_at at the app layer via Sequelize, but the
// database column should also default to the current time so rows inserted outside the ORM
// (migrations, manual SQL, bulk loads) still get valid timestamps. This test walks the live
// migrated schema and asserts the DB-level default is in place, catching any new table that
// forgets it.
describe('created_at / updated_at columns', () => {
  let sequelize;

  beforeAll(async () => {
    ({ sequelize } = await createTestDatabase());
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('every public table defaults created_at and updated_at to NOW()', async () => {
    const columns = await sequelize.query(
      `
      SELECT table_name, column_name, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name IN ('created_at', 'updated_at')
      ORDER BY table_name, column_name
      `,
      { type: QueryTypes.SELECT },
    );

    // Postgres reports the default as now() or CURRENT_TIMESTAMP depending on how the migration
    // wrote it, optionally with a fractional-seconds precision (e.g. CURRENT_TIMESTAMP(3)). These
    // are all the same wall-clock default and all acceptable.
    const isNowDefault = (value) =>
      value !== null && /^(now\(\)|current_timestamp(\(\d+\))?)$/i.test(value.trim());

    const offenders = columns
      .filter(({ column_default }) => !isNowDefault(column_default))
      .map(({ table_name, column_name, column_default }) => ({
        table: table_name,
        column: column_name,
        default: column_default,
      }));

    expect(offenders).toEqual([]);
  });

  // logs.record_change() copies created_at / updated_at into logs.changes, where both are NOT
  // NULL, so a NULL in a logged table would make the row impossible to update or hard-delete.
  it('every changelog-logged table has NOT NULL created_at and updated_at', async () => {
    const columns = await sequelize.query(
      `
      SELECT c.table_name, c.column_name
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.column_name IN ('created_at', 'updated_at')
        AND c.is_nullable = 'YES'
        AND EXISTS (
          SELECT 1 FROM pg_trigger t
          JOIN pg_class r ON r.oid = t.tgrelid
          JOIN pg_namespace n ON n.oid = r.relnamespace
          WHERE n.nspname = c.table_schema AND r.relname = c.table_name
            AND t.tgname = 'record_' || c.table_name || '_changelog'
        )
      ORDER BY c.table_name, c.column_name
      `,
      { type: QueryTypes.SELECT },
    );

    const offenders = columns.map(({ table_name, column_name }) => `${table_name}.${column_name}`);

    expect(offenders).toEqual([]);
  });
});
