import { readFileSync } from 'node:fs';
import path from 'node:path';
import { QueryTypes } from 'sequelize';
import type { QueryInterface } from 'sequelize';

const BASELINE_SQL_PATH = path.join(__dirname, '000_baseline.sql');
const FROZEN_MIGRATIONS_PATH = path.join(__dirname, '000_baseline_frozen_migrations.json');

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

  // The baseline SQL uses gen_random_uuid() which is built-in on PG >= 13
  // but requires the pgcrypto extension on PG 12.
  const rows: any[] = await query.sequelize.query(
    "SELECT setting FROM pg_settings WHERE name = 'server_version_num' LIMIT 1",
    { type: QueryTypes.SELECT },
  );
  if ((rows?.[0]?.setting ?? 0) < 130000) {
    await query.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  }

  // Use a pool connection directly so the multi-statement pg_dump SQL executes
  // via the simple query protocol. sequelize.query() also uses the simple
  // protocol when there are no bind params, but its result processing doesn't
  // handle multi-result-set responses from pg_dump output well. Using a pool
  // connection (rather than a standalone pg.Client) ensures triggers remain
  // visible to information_schema from other pool connections.
  const pgClient = await (query.sequelize.connectionManager as any).getConnection({
    type: 'write',
  });
  try {
    const sql = readFileSync(BASELINE_SQL_PATH, 'utf-8');
    await (pgClient as any).query(sql);
    // pg_dump's set_config('search_path', '', false) clears the session search_path.
    // Reset to the server default so the connection is usable after release.
    await (pgClient as any).query('RESET search_path');
  } finally {
    (query.sequelize.connectionManager as any).releaseConnection(pgClient);
  }

  // Also reset on the Sequelize (CLS-bound) connection in case pg_dump's
  // search_path change leaked through the transaction.
  await query.sequelize.query('RESET search_path');

  const frozenMigrations: string[] = JSON.parse(readFileSync(FROZEN_MIGRATIONS_PATH, 'utf-8'));
  const values = frozenMigrations.map(n => `('${n}')`).join(',');
  await query.sequelize.query(`INSERT INTO "SequelizeMeta" (name) VALUES ${values} ON CONFLICT DO NOTHING`);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP SCHEMA IF EXISTS fhir CASCADE');
  await query.sequelize.query('DROP SCHEMA IF EXISTS logs CASCADE');
  await query.sequelize.query('DROP SCHEMA IF EXISTS public CASCADE');
  await query.sequelize.query('CREATE SCHEMA public');
}
