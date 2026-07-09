import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { log } from '@tamanu/shared/services/logging/log';
import { closeDatabase, createTestDatabase } from '../../utilities';
import {
  createMigrationInterface,
  flushDeferredConstraints,
  runInRollbackTransaction,
} from '../../../src/services/migrations/migrations';

// A dry-run migrate runs the real migration code path inside one outer transaction that is
// always rolled back, so it must commit nothing. These tests avoid reverting real
// migrations (whose down() functions are not all cleanly re-runnable, which would couple
// the test to whichever migration happens to be the tip); they prove the rollback
// guarantee directly instead.
describe('migrate --dry-run', () => {
  let sequelize;

  beforeEach(async () => {
    ({ sequelize } = await createTestDatabase());
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('runs the dry-run code path without recording any migrations', async () => {
    // Smoke test of the real `sequelize.migrate('up', { dryRun })` entry point (rollback
    // wrapping, version check, summary). The rollback guarantee itself is proven by the
    // runInRollbackTransaction suite below; here we only assert SequelizeMeta is untouched.
    const { migrations } = await createMigrationInterface(log, sequelize);
    const executedBefore = (await migrations.executed()).map((migration) => migration.file);

    await sequelize.migrate('up', { dryRun: true });

    const executedAfter = (await migrations.executed()).map((migration) => migration.file);
    expect(executedAfter).toEqual(executedBefore);
  });

  it('refuses --dry-run for down migrations', async () => {
    await expect(sequelize.migrate('down', { dryRun: true })).rejects.toThrow(
      /only supported for/,
    );
  });

  it('refuses a dry run without a parent transaction to nest under', async () => {
    // Guards the footgun where a missing parentTransaction would make each migration's
    // `sequelize.transaction({ transaction: null })` an independent, committing transaction.
    await expect(createMigrationInterface(log, sequelize, { dryRun: true })).rejects.toThrow(
      /requires a parentTransaction/,
    );
  });
});

describe('runInRollbackTransaction', () => {
  let sequelize;

  beforeEach(async () => {
    ({ sequelize } = await createTestDatabase());
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('rolls back SequelizeMeta writes, so a dry-run migration is never recorded', async () => {
    const probeName = 'dry-run-probe-migration.js';

    await runInRollbackTransaction(sequelize, async () => {
      await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES ($name)', {
        bind: { name: probeName },
      });
    });

    const [recorded] = await sequelize.query('SELECT name FROM "SequelizeMeta" WHERE name = $name', {
      bind: { name: probeName },
    });
    expect(recorded).toHaveLength(0);
  });

  it('rolls back DDL', async () => {
    await runInRollbackTransaction(sequelize, async () => {
      await sequelize.query('CREATE TABLE dry_run_rollback_probe (id INTEGER)');
    });

    const [tables] = await sequelize.query(
      `SELECT to_regclass('public.dry_run_rollback_probe') AS oid`,
    );
    expect(tables[0].oid).toBeNull();
  });
});

// The dry run runs every migration inside one outer transaction, so DEFERRABLE INITIALLY
// DEFERRED changelog triggers (which only fire at COMMIT, not at RELEASE SAVEPOINT) would
// accumulate across migrations and a later DDL migration would trip "pending trigger
// events" on a table an earlier DML migration wrote to. flushDeferredConstraints fires them
// at each boundary to mimic the per-migration COMMIT of a real run. This exercises that
// mechanism directly with a probe table rather than relying on specific migrations.
describe('flushDeferredConstraints', () => {
  let sequelize;

  beforeEach(async () => {
    ({ sequelize } = await createTestDatabase());
  });

  afterEach(async () => {
    await closeDatabase();
  });

  // Creates a table with a deferred constraint trigger, then a queued INSERT, so that a
  // following ALTER TABLE would see pending trigger events unless they are flushed first.
  const setUpProbeTable = async () => {
    await sequelize.query('CREATE TABLE deferred_flush_probe (id INTEGER)');
    await sequelize.query(`
      CREATE FUNCTION pg_temp.deferred_flush_probe_noop() RETURNS trigger
      AS $$ BEGIN RETURN NULL; END; $$ LANGUAGE plpgsql
    `);
    await sequelize.query(`
      CREATE CONSTRAINT TRIGGER deferred_flush_probe_changelog
      AFTER INSERT OR UPDATE ON deferred_flush_probe
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW
      EXECUTE FUNCTION pg_temp.deferred_flush_probe_noop()
    `);
    await sequelize.query('INSERT INTO deferred_flush_probe (id) VALUES (1)');
  };

  it('reproduces the pending trigger events failure when not flushed', async () => {
    await expect(
      runInRollbackTransaction(sequelize, async () => {
        await setUpProbeTable();
        // DDL on a table with a pending deferred trigger event: PostgreSQL refuses.
        await sequelize.query('ALTER TABLE deferred_flush_probe ADD COLUMN extra INTEGER');
      }),
    ).rejects.toThrow(/pending trigger events/);
  });

  it('clears pending events so the following DDL succeeds', async () => {
    await runInRollbackTransaction(sequelize, async () => {
      await setUpProbeTable();
      await flushDeferredConstraints(sequelize);
      // With the deferred events flushed, the same DDL now goes through.
      await sequelize.query('ALTER TABLE deferred_flush_probe ADD COLUMN extra INTEGER');
    });
  });
});
