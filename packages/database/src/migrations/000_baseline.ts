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

  const schemaExists = (results as any[])[0]?.schema_exists;
  console.log('[baseline] schema_exists (users table):', schemaExists);

  if (schemaExists) {
    const [cols] = await query.sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'logs' AND table_name = 'changes'
      ORDER BY ordinal_position
    `);
    console.log('[baseline] SKIPPING baseline — logs.changes columns:', JSON.stringify((cols as any[]).map((c: any) => c.column_name)));
    return;
  }

  const pgClient = await (query.sequelize.connectionManager as any).getConnection({
    type: 'write',
  });
  try {
    let sql = readFileSync(BASELINE_SQL_PATH, 'utf-8');
    console.log('[baseline] SQL file size:', sql.length, 'bytes');

    const versionResult = await (pgClient as any).query(
      "SELECT setting FROM pg_settings WHERE name = 'server_version_num' LIMIT 1",
    );
    const pgVersionNum = versionResult.rows?.[0]?.setting ?? 0;
    console.log('[baseline] PG version_num:', pgVersionNum);

    if (pgVersionNum < 130000) {
      await (pgClient as any).query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
      sql = sql.replace(
        "SELECT pg_catalog.set_config('search_path', '', false);",
        "SELECT pg_catalog.set_config('search_path', 'public', false);",
      );
    }

    await (pgClient as any).query(sql);
    console.log('[baseline] SQL executed successfully');
    await (pgClient as any).query('RESET search_path');

    // Verify logs.changes columns right after baseline SQL execution (on pgClient)
    const verifyResult = await (pgClient as any).query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'logs' AND table_name = 'changes'
      ORDER BY ordinal_position
    `);
    console.log('[baseline] logs.changes columns after SQL (pgClient):', JSON.stringify(verifyResult.rows.map((r: any) => r.column_name)));
  } catch (err: any) {
    console.error('[baseline] SQL execution FAILED:', err.message);
    throw err;
  } finally {
    (query.sequelize.connectionManager as any).releaseConnection(pgClient);
  }

  // Also verify from the sequelize connection
  const [seqCols] = await query.sequelize.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'logs' AND table_name = 'changes'
    ORDER BY ordinal_position
  `);
  console.log('[baseline] logs.changes columns (sequelize conn):', JSON.stringify((seqCols as any[]).map((c: any) => c.column_name)));

  await query.sequelize.query('RESET search_path');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP SCHEMA IF EXISTS fhir CASCADE');
  await query.sequelize.query('DROP SCHEMA IF EXISTS logs CASCADE');
  await query.sequelize.query('DROP SCHEMA IF EXISTS public CASCADE');
  await query.sequelize.query('CREATE SCHEMA public');
}
