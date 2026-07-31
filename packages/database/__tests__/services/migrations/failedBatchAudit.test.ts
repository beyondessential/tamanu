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
    const migrations = {
      up: async () => {
        throw new Error('migration blew up');
      },
      // a committed on its own before b threw
      executed: async () => [{ file: 'a.ts' }],
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
    const migrations = {
      up: async () => {
        throw new Error('migration blew up');
      },
      executed: async () => {
        throw new Error('connection gone');
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
