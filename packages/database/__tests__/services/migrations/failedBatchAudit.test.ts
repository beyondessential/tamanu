import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { log } from '@tamanu/shared/services/logging/log';
import { closeDatabase, createTestDatabase } from '../../utilities';
import { migrateUpTo } from '../../../src/services/migrations/migrations';

// These drive migrateUpTo with a stub umzug so a partway failure can be staged without
// coupling the test to whichever migration happens to be the tip, and without needing a
// migration that genuinely breaks.
describe('migration batch auditing', () => {
  let sequelize;

  const pending = [{ file: 'a.ts' }, { file: 'b.ts' }, { file: 'c.ts' }];

  const latestBatch = async () => {
    const [rows] = await sequelize.query(
      `SELECT migrations, stats FROM logs.migrations WHERE direction = 'up'
       ORDER BY logged_at DESC LIMIT 1`,
    );
    return rows[0];
  };

  beforeEach(async () => {
    ({ sequelize } = await createTestDatabase());
    await sequelize.query('DELETE FROM logs.migrations');
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('records what applied and where it stopped when a migration throws', async () => {
    const executed: { file: string }[] = [];
    const migrations = {
      up: async () => {
        // a committed on its own before b threw
        executed.push({ file: 'a.ts' });
        throw new Error('migration blew up');
      },
      executed: async () => [...executed],
    };

    await expect(
      migrateUpTo({
        log,
        sequelize,
        pending,
        migrations,
        getDurationStats: () => ({ 'a.ts': 4000 }),
      }),
    ).rejects.toThrow('migration blew up');

    const batch = await latestBatch();
    expect(batch.migrations).toEqual(['a.ts']);
    expect(batch.stats.failedMigration).toBe('b.ts');
    expect(batch.stats.durationMsPerMigration).toEqual({ 'a.ts': 4000 });
  });

  it('credits only this batch when the caller passes a stale pending list', async () => {
    // An upgrade runs several batches through one interface without regathering `pending`,
    // so a and b here were applied by an earlier batch and already audited under it.
    const executed = [{ file: 'a.ts' }, { file: 'b.ts' }];
    const migrations = {
      up: async () => {
        executed.push({ file: 'c.ts' });
        throw new Error('migration blew up');
      },
      executed: async () => [...executed],
    };

    await expect(
      migrateUpTo({
        log,
        sequelize,
        pending: [...pending, { file: 'd.ts' }],
        migrations,
        getDurationStats: () => ({ 'a.ts': 1000, 'b.ts': 2000, 'c.ts': 3000 }),
      }),
    ).rejects.toThrow('migration blew up');

    const batch = await latestBatch();
    expect(batch.migrations).toEqual(['c.ts']);
    expect(batch.stats.failedMigration).toBe('d.ts');
    expect(batch.stats.durationMsPerMigration).toEqual({ 'c.ts': 3000 });
  });

  it('records no failure on a batch that completes', async () => {
    const migrations = {
      up: async () => pending,
      executed: async () => pending,
    };

    await migrateUpTo({
      log,
      sequelize,
      pending,
      migrations,
      getDurationStats: () => ({}),
    });

    const batch = await latestBatch();
    expect(batch.migrations).toEqual(['a.ts', 'b.ts', 'c.ts']);
    expect(batch.stats.failedMigration).toBeUndefined();
  });

  it('throws the migration error even when the batch cannot be recorded', async () => {
    let hasRun = false;
    const migrations = {
      up: async () => {
        hasRun = true;
        throw new Error('migration blew up');
      },
      // fine when the batch starts, gone by the time the failure is recorded
      executed: async () => {
        if (hasRun) throw new Error('connection gone');
        return [];
      },
    };

    await expect(
      migrateUpTo({
        log,
        sequelize,
        pending,
        migrations,
        getDurationStats: () => ({}),
      }),
    ).rejects.toThrow('migration blew up');
  });
});
