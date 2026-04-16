import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { QueryInterface } from 'sequelize';

const BASELINE_SQL_PATH = path.join(__dirname, '000_baseline.sql');

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
    let sql = readFileSync(BASELINE_SQL_PATH, 'utf-8');

    // The baseline SQL uses gen_random_uuid() which is built-in (in pg_catalog)
    // on PG >= 13. On PG 12 it requires the pgcrypto extension, which installs
    // the function in the public schema. The pg_dump output clears search_path
    // to '', so we must keep 'public' in the path for the function to resolve.
    const versionResult = await (pgClient as any).query(
      "SELECT setting FROM pg_settings WHERE name = 'server_version_num' LIMIT 1",
    );
    if ((versionResult.rows?.[0]?.setting ?? 0) < 130000) {
      await (pgClient as any).query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
      sql = sql.replace(
        "SELECT pg_catalog.set_config('search_path', '', false);",
        "SELECT pg_catalog.set_config('search_path', 'public', false);",
      );
    }

    await (pgClient as any).query(sql);
    // pg_dump's set_config('search_path', ...) changes the session search_path.
    // Reset to the server default so the connection is usable after release.
    await (pgClient as any).query('RESET search_path');
  } finally {
    (query.sequelize.connectionManager as any).releaseConnection(pgClient);
  }

  // Also reset on the Sequelize (CLS-bound) connection in case pg_dump's
  // search_path change leaked through the transaction.
  await query.sequelize.query('RESET search_path');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP SCHEMA IF EXISTS fhir CASCADE');
  await query.sequelize.query('DROP SCHEMA IF EXISTS logs CASCADE');
  await query.sequelize.query('DROP SCHEMA IF EXISTS public CASCADE');
  await query.sequelize.query('CREATE SCHEMA public');
}
