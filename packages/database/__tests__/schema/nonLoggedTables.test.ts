import { QueryTypes } from 'sequelize';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { NON_LOGGED_TABLES } from '../../src/services/migrations/constants';
import { closeDatabase, createTestDatabase } from '../utilities';

// The addRecordChangeTrigger post-migration hook only adds changelog triggers, so a table moved
// into NON_LOGGED_TABLES keeps its trigger unless a migration drops it.
describe('NON_LOGGED_TABLES', () => {
  let sequelize;

  beforeAll(async () => {
    ({ sequelize } = await createTestDatabase());
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('carry no changelog trigger', async () => {
    const loggedTables = await sequelize.query(
      `
      SELECT n.nspname || '.' || r.relname AS qualified_table
      FROM pg_trigger t
      JOIN pg_class r ON r.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = r.relnamespace
      WHERE t.tgname = 'record_' || r.relname || '_changelog'
      `,
      { type: QueryTypes.SELECT },
    );

    const isNonLogged = qualifiedTable =>
      NON_LOGGED_TABLES.some(pattern =>
        pattern.endsWith('.*')
          ? qualifiedTable.startsWith(pattern.slice(0, -1))
          : qualifiedTable === pattern,
      );

    const offenders = loggedTables
      .map(({ qualified_table }) => qualified_table)
      .filter(isNonLogged);

    expect(offenders).toEqual([]);
  });
});
