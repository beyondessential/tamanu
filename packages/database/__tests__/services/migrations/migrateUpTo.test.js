import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { QueryTypes } from 'sequelize';
import { closeDatabase, initDatabase } from '../../utilities';
import { createMigrationInterface, migrateUpTo } from '@tamanu/database/services/migrations';
import { tablesWithTrigger, tablesWithoutTrigger } from '../../../src/utils';
import {
  GLOBAL_EXCLUDE_TABLES,
  NON_LOGGED_TABLES,
} from '../../../src/services/migrations/constants';
import { log } from '@tamanu/shared/services/logging/log';

const RECORD_CHANGELOG_EXCLUDES = [...GLOBAL_EXCLUDE_TABLES, ...NON_LOGGED_TABLES];

/** Returns true if record_patients_changelog on public.patients is a constraint trigger, false if non-constraint, null if trigger missing. */
const isPatientsChangelogConstraintTrigger = async sequelize => {
  const rows = await sequelize.query(
    `
      SELECT
        t.tgconstraint
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE t.tgname LIKE 'record_%_changelog'
        AND NOT t.tgisinternal
        AND n.nspname = 'public'
        AND c.relname = 'patients'
      ORDER BY n.nspname, c.relname
    `,
    { type: QueryTypes.SELECT },
  );
  const row = rows?.[0];
  if (row == null) return null;
  return Number(row.tgconstraint) !== 0;
};

// Migration that runs just before addAuditTrigger (which creates record_change)
const BEFORE_RECORD_CHANGE = '1739970132204-ensureSystemUserPresent';
// Migration that adds the record_change function
const AFTER_RECORD_CHANGE = '1739970132205-addAuditTrigger';

describe('migrateUpTo', () => {
  let database;
  let migrations;

  beforeEach(async () => {
    database = await initDatabase({ recreateDatabase: true });
    migrations = createMigrationInterface(log, database.sequelize);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('applies post-migration hooks correctly at each migration stage', async () => {
    let pending = await migrations.pending();
    expect(pending.length).toBeGreaterThan(0);

    // Stop 1: before addAuditTrigger — no record_change triggers yet
    const beforeRecordChangeMigration = pending.find(mig => mig.testFileName(BEFORE_RECORD_CHANGE));
    await migrateUpTo({
      log,
      sequelize: database.sequelize,
      pending,
      migrations,
      upOpts: { to: beforeRecordChangeMigration.file },
    });
    const tablesWithChangelogBeforeTriggerIsInstalled = await tablesWithTrigger(
      database.sequelize,
      'record_',
      '_changelog',
      RECORD_CHANGELOG_EXCLUDES,
    );
    expect(tablesWithChangelogBeforeTriggerIsInstalled).toHaveLength(0);

    // Stop 2: after addAuditTrigger — old (non-constraint) triggers installed
    pending = await migrations.pending();
    const afterRecordChangeMigration = pending.find(mig => mig.testFileName(AFTER_RECORD_CHANGE));
    await migrateUpTo({
      log,
      sequelize: database.sequelize,
      pending,
      migrations,
      upOpts: { to: afterRecordChangeMigration.file },
    });
    const tablesWithoutChangelogAfterTriggerIsInstalled = await tablesWithoutTrigger(
      database.sequelize,
      'record_',
      '_changelog',
      RECORD_CHANGELOG_EXCLUDES,
    );
    expect(tablesWithoutChangelogAfterTriggerIsInstalled).toHaveLength(0);
    expect(await isPatientsChangelogConstraintTrigger(database.sequelize)).toBe(false);

    // Stop 3: run all remaining — constraint triggers installed
    pending = await migrations.pending();
    await migrateUpTo({
      log,
      sequelize: database.sequelize,
      pending,
      migrations,
      upOpts: undefined,
    });
    const tablesWithoutChangelogAfterAllMigrations = await tablesWithoutTrigger(
      database.sequelize,
      'record_',
      '_changelog',
      RECORD_CHANGELOG_EXCLUDES,
    );
    expect(tablesWithoutChangelogAfterAllMigrations).toHaveLength(0);
    expect(await isPatientsChangelogConstraintTrigger(database.sequelize)).toBe(true);
  }, 60000);
});
