import type { QueryInterface } from 'sequelize';

const TEST_DELAY_MS = 30_000;

/**
 * Test-only: deliberately slow so you can confirm `logs.migrations` stats
 * (e.g. `batch_duration_ms`, `durationMsPerMigration`). Remove or replace
 * before merging if this file was only for local checks.
 */
export async function up(_query: QueryInterface): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, TEST_DELAY_MS);
  });
}

export async function down(_query: QueryInterface): Promise<void> {
  // no-op
}
