import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { QueryInterface } from 'sequelize';

const BASELINE_SQL_PATH = path.join(__dirname, '000_baseline.sql');

export async function up(query: QueryInterface): Promise<void> {
  // Skip if schema already exists (existing deployment that already ran the original migrations)
  const [results] = await query.sequelize.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    ) AS schema_exists
  `);

  if ((results as any[])[0]?.schema_exists) {
    return;
  }

  const sql = readFileSync(BASELINE_SQL_PATH, 'utf-8');
  await query.sequelize.query(sql);

  // pg_dump sets search_path to '' — restore it so Umzug can find SequelizeMeta
  await query.sequelize.query(`SET search_path = public, fhir, logs`);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: drops all schemas created by the baseline
  await query.sequelize.query('DROP SCHEMA IF EXISTS fhir CASCADE');
  await query.sequelize.query('DROP SCHEMA IF EXISTS logs CASCADE');
  await query.sequelize.query('DROP SCHEMA IF EXISTS public CASCADE');
  await query.sequelize.query('CREATE SCHEMA public');
}
