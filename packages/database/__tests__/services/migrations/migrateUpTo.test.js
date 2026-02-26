import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { QueryTypes } from 'sequelize';
import { closeDatabase, initDatabase } from '../../utilities';
import {
  createMigrationInterface,
  migrateUpTo,
} from '../../../dist/cjs/services/migrations/migrations';
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
// Migration that runs just before convertChangelogToConstraintTriggers
const BEFORE_CONSTRAINT_TRIGGERS = '1764620401759-addInvoiceProductInsurable';

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

  it('does not install record_change triggers when migrated up to before addAuditTrigger', async () => {
    const pending = await migrations.pending();
    expect(pending.length).toBeGreaterThan(0);
    const beforeRecordChangeMigration = pending.find(mig => mig.testFileName(BEFORE_RECORD_CHANGE));

    await migrateUpTo({
      log,
      sequelize: database.sequelize,
      pending,
      migrations,
      upOpts: { to: beforeRecordChangeMigration.file },
    });

    const tablesWithRecordChangelog = await tablesWithTrigger(
      database.sequelize,
      'record_',
      '_changelog',
      RECORD_CHANGELOG_EXCLUDES,
    );
    expect(tablesWithRecordChangelog).toHaveLength(0);
  }, 30000);

  it('installs old (non-constraint) record_change triggers when migrated up to before convertChangelogToConstraintTriggers', async () => {
    let pending = await migrations.pending();
    const beforeRecordChangeMigration = pending.find(mig => mig.testFileName(BEFORE_RECORD_CHANGE));
    await migrateUpTo({
      log,
      sequelize: database.sequelize,
      pending,
      migrations,
      upOpts: { to: beforeRecordChangeMigration.file },
    });

    pending = await migrations.pending();
    const beforeConstraintTriggersMigration = pending.find(mig =>
      mig.testFileName(BEFORE_CONSTRAINT_TRIGGERS),
    );
    await migrateUpTo({
      log,
      sequelize: database.sequelize,
      pending,
      migrations,
      upOpts: { to: beforeConstraintTriggersMigration.file },
    });

    const tablesWithoutRecordChangelog = await tablesWithoutTrigger(
      database.sequelize,
      'record_',
      '_changelog',
      RECORD_CHANGELOG_EXCLUDES,
    );
    expect(tablesWithoutRecordChangelog).toHaveLength(0);

    const isConstraint = await isPatientsChangelogConstraintTrigger(database.sequelize);
    expect(isConstraint).toBe(false);
  }, 30000);

  it('installs constraint record_change triggers after full migration', async () => {
    let pending = await migrations.pending();
    const beforeConstraintTriggersMigration = pending.find(mig =>
      mig.testFileName(BEFORE_CONSTRAINT_TRIGGERS),
    );
    await migrateUpTo({
      log,
      sequelize: database.sequelize,
      pending,
      migrations,
      upOpts: { to: beforeConstraintTriggersMigration.file },
    });

    pending = await migrations.pending();
    await migrateUpTo({
      log,
      sequelize: database.sequelize,
      pending,
      migrations,
      upOpts: undefined,
    });

    const tablesWithoutRecordChangelog = await tablesWithoutTrigger(
      database.sequelize,
      'record_',
      '_changelog',
      RECORD_CHANGELOG_EXCLUDES,
    );
    expect(tablesWithoutRecordChangelog).toHaveLength(0);

    const isConstraint = await isPatientsChangelogConstraintTrigger(database.sequelize);
    expect(isConstraint).toBe(true);
  }, 30000);
});
