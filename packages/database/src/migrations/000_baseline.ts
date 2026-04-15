import { readFileSync } from 'node:fs';
import path from 'node:path';
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

  // Use a standalone pg connection with the simple query protocol so the
  // multi-statement pg_dump SQL executes fully. sequelize.query() uses the
  // extended protocol which only supports a single statement per call.
  // This runs outside the Umzug transaction (autocommit) which is acceptable
  // since the skip-check above provides idempotency.
  const { Client } = require('pg');
  const cfg = query.sequelize.config;
  const client = new Client({
    host: cfg.host,
    port: cfg.port,
    user: cfg.username,
    password: cfg.password,
    database: cfg.database,
  });
  await client.connect();
  try {
    const sql = readFileSync(BASELINE_SQL_PATH, 'utf-8');
    await client.query(sql);
  } finally {
    await client.end();
  }

  // Restore search_path on the Sequelize connection after pg_dump's SET search_path = ''
  await query.sequelize.query('SET search_path = public, fhir, logs');

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
