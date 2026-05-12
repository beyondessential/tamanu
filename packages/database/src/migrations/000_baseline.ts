import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { QueryInterface } from 'sequelize';

const BASELINE_SQL_PATH = path.join(__dirname, '000_baseline.sql');
const FROZEN_MIGRATIONS_PATH = path.join(__dirname, '000_baseline_frozen_migrations.json');
const BASELINE_STATE_SCHEMA = 'tamanu_baseline';
const BASELINE_APPLIED_TABLE = 'applied';

export async function up(query: QueryInterface): Promise<void> {
  const [results] = await query.sequelize.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    ) AS schema_exists
  `);

  if ((results as any[])[0]?.schema_exists) {
    return;
  }

  // Pool connection for multi-statement pg_dump SQL (sequelize.query can't
  // handle multi-result-set responses). Pool connection rather than standalone
  // pg.Client so triggers are visible to information_schema across connections.
  const pgClient = await (query.sequelize.connectionManager as any).getConnection({
    type: 'write',
  });
  try {
    let sql = readFileSync(BASELINE_SQL_PATH, 'utf-8');

    // PG 12 needs pgcrypto for gen_random_uuid(); pg_dump clears search_path
    // so we keep 'public' in the path for the function to resolve.
    const versionResult = await (pgClient as any).query(
      "SELECT setting FROM pg_settings WHERE name = 'server_version_num' LIMIT 1",
    );
    if (Number(versionResult.rows?.[0]?.setting ?? 0) < 130000) {
      await (pgClient as any).query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
      sql = sql.replace(
        "SELECT pg_catalog.set_config('search_path', '', false);",
        "SELECT pg_catalog.set_config('search_path', 'public', false);",
      );
    }

    await (pgClient as any).query(sql);
    await (pgClient as any).query('RESET search_path');
  } finally {
    (query.sequelize.connectionManager as any).releaseConnection(pgClient);
  }

  // Reset on the Sequelize (CLS-bound) connection too.
  await query.sequelize.query('RESET search_path');

  // Mark frozen migrations as applied so Umzug skips them.
  const frozenMigrations: string[] = JSON.parse(readFileSync(FROZEN_MIGRATIONS_PATH, 'utf-8'));
  await query.sequelize.query(
    `INSERT INTO "SequelizeMeta" (name) SELECT unnest($1::text[]) ON CONFLICT DO NOTHING`,
    { bind: [frozenMigrations] },
  );

  await query.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${BASELINE_STATE_SCHEMA}`);
  await query.sequelize.query(`
    CREATE TABLE IF NOT EXISTS ${BASELINE_STATE_SCHEMA}.${BASELINE_APPLIED_TABLE} (
      id boolean PRIMARY KEY DEFAULT true CHECK (id),
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await query.sequelize.query(`
    INSERT INTO ${BASELINE_STATE_SCHEMA}.${BASELINE_APPLIED_TABLE} (id)
    VALUES (true)
    ON CONFLICT DO NOTHING
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  const [results] = await query.sequelize.query(`
    SELECT to_regclass('"${BASELINE_STATE_SCHEMA}"."${BASELINE_APPLIED_TABLE}"') IS NOT NULL AS baseline_applied
  `);

  if (!(results as any[])[0]?.baseline_applied) {
    return;
  }

  // DESTRUCTIVE: Only the baseline-created schema can be reverted; all data is dropped.
  await query.sequelize.query('DROP SCHEMA IF EXISTS fhir CASCADE');
  await query.sequelize.query('DROP SCHEMA IF EXISTS logs CASCADE');
  await query.sequelize.query('DROP SCHEMA IF EXISTS sync_snapshots CASCADE');
  await query.sequelize.query('DROP SCHEMA IF EXISTS public CASCADE');
  await query.sequelize.query(`DROP SCHEMA IF EXISTS ${BASELINE_STATE_SCHEMA} CASCADE`);
  await query.sequelize.query('CREATE SCHEMA public');
}
