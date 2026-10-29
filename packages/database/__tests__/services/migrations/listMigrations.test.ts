import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PENDING_MIGRATIONS_EXIT_CODE } from '../../../src/services/migrations/migrations';
import { closeDatabase, createTestDatabase } from '../../utilities';

// Deployment tooling relies on `just-migrate list --check` to decide whether to run the
// migrator, so its exit code is a contract.
describe('migrate list', () => {
  let sequelize;
  let printedLines: string[];
  let unrecordedMigration: string | null;

  // Makes the latest migration look pending by dropping its record, without touching the
  // schema it created. afterEach puts the record back so the next test's `migrate up` skips it.
  const makeLatestMigrationPending = async () => {
    const [[{ name }]] = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" ORDER BY name DESC LIMIT 1',
    );
    await sequelize.query('DELETE FROM "SequelizeMeta" WHERE name = $1', { bind: [name] });
    unrecordedMigration = name;
    return name;
  };

  beforeEach(async () => {
    ({ sequelize } = await createTestDatabase());
    printedLines = [];
    unrecordedMigration = null;
    vi.spyOn(console, 'log').mockImplementation(line => {
      printedLines.push(line);
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
    if (unrecordedMigration) {
      await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES ($1)', {
        bind: [unrecordedMigration],
      });
    }
    await closeDatabase();
  });

  it('lists pending migrations', async () => {
    const pendingMigration = await makeLatestMigrationPending();

    await sequelize.migrate('list', { pending: true });

    expect(printedLines).toEqual(['Pending migrations (1):', `  ${pendingMigration}`]);
  });

  it('lists done migrations', async () => {
    const [[{ count }]] = await sequelize.query(
      'SELECT count(*)::int AS count FROM "SequelizeMeta"',
    );

    await sequelize.migrate('list', { done: true });

    expect(printedLines[0]).toBe(`Done migrations (${count}):`);
    expect(printedLines).toHaveLength(count + 1);
  });

  it('lists both, done first, when neither or both are chosen', async () => {
    await makeLatestMigrationPending();

    for (const options of [{}, { pending: true, done: true }]) {
      printedLines = [];
      await sequelize.migrate('list', options);

      const headings = printedLines.filter(line => !line.startsWith('  '));
      expect(headings).toEqual([
        expect.stringMatching(/^Done migrations/),
        'Pending migrations (1):',
      ]);
    }
  });

  it('prints nothing for an empty list', async () => {
    await sequelize.migrate('list', { pending: true });

    expect(printedLines).toEqual([]);
  });

  it('sets the pending exit code with --check when migrations are pending', async () => {
    await makeLatestMigrationPending();

    await sequelize.migrate('list', { pending: true, check: true });

    expect(process.exitCode).toBe(PENDING_MIGRATIONS_EXIT_CODE);
  });

  it('checks pending migrations even when listing only done ones', async () => {
    await makeLatestMigrationPending();

    await sequelize.migrate('list', { done: true, check: true });

    expect(process.exitCode).toBe(PENDING_MIGRATIONS_EXIT_CODE);
  });

  it('leaves the exit code alone with --check when nothing is pending', async () => {
    await sequelize.migrate('list', { pending: true, check: true });

    expect(process.exitCode).toBeUndefined();
  });

  it('leaves the exit code alone without --check', async () => {
    await makeLatestMigrationPending();

    await sequelize.migrate('list', { pending: true });

    expect(process.exitCode).toBeUndefined();
  });
});
