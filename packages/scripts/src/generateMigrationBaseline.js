#!/usr/bin/env node

/**
 * Generates a SQL baseline snapshot of the database schema at v2.32.
 *
 * Uses the same test DB infrastructure as the rest of the project:
 * - initDatabase with testMode + recreateDatabase to get a fresh DB
 * - Pre-populates SequelizeMeta with post-v2.32 migration names so they're skipped
 * - Runs migrate('up') so only v2.32 migrations execute
 * - Removes the post-v2.32 SequelizeMeta entries
 * - pg_dump the result
 *
 * The output SQL contains the full v2.32 schema, migration-seeded data,
 * and SequelizeMeta entries for the squashed migrations only.
 */

const { execSync } = require('child_process');
const fs = require('node:fs');
const path = require('node:path');

const DB_NAME = 'tamanu-baseline-generator';
const BASELINE_TAG = 'v2.32.9';
const OUTPUT_PATH = path.resolve(
  __dirname,
  '../../database/src/migrations/000_baseline.sql',
);

function getPostBaselineMigrations() {
  // Get the set of migration filenames present at the baseline tag
  const v232Files = new Set(
    execSync(
      `git ls-tree --name-only ${BASELINE_TAG} -- packages/database/src/migrations/`,
    )
      .toString()
      .trim()
      .split('\n')
      .map(p => p.replace('packages/database/src/migrations/', ''))
      .filter(f => f && f !== '000_initial'),
  );

  // Get all current migration filenames from the built dist (what Umzug sees)
  const distDir = path.resolve(__dirname, '../../database/dist/cjs/migrations');
  const currentFiles = fs
    .readdirSync(distDir)
    .filter(f => f.endsWith('.js') && !f.endsWith('.d.ts'));

  // Post-baseline = in current dist but not in v2.32 source (after .ts → .js conversion)
  const v232JsNames = new Set(
    [...v232Files].map(f => f.replace(/\.ts$/, '.js')),
  );

  return currentFiles.filter(f => !v232JsNames.has(f) && !f.startsWith('000_baseline'));
}

async function run() {
  const { default: config } = await import('config');
  const serverConfig = config.util.loadFileConfigs(
    path.join('packages', 'central-server', 'config'),
  );
  const dbConfig = config.util.extendDeep(serverConfig.db, config.db);

  const { initDatabase } = require('@tamanu/database/services/database');

  console.log('Creating fresh database:', DB_NAME);
  const db = await initDatabase({
    ...dbConfig,
    testMode: true,
    recreateDatabase: true,
    name: DB_NAME,
    disableChangesAudit: true,
  });

  const { sequelize } = db;

  // Ensure SequelizeMeta table exists
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
      name VARCHAR(255) NOT NULL PRIMARY KEY
    );
  `);

  // Pre-populate SequelizeMeta with post-v2.32 AND 000_baseline migration names so Umzug skips them.
  // 000_baseline must be skipped during generation — we're generating the SQL it will contain.
  const postBaselineMigrations = [
    '000_baseline.js',
    ...getPostBaselineMigrations(),
  ];
  console.log(
    `Pre-populating SequelizeMeta with ${postBaselineMigrations.length} migration names to skip`,
  );

  if (postBaselineMigrations.length > 0) {
    const values = postBaselineMigrations.map(n => `('${n}')`).join(',\n');
    await sequelize.query(
      `INSERT INTO "SequelizeMeta" (name) VALUES ${values}`,
    );
  }

  // Run migrations — only v2.32 ones will execute since post-v2.32 are already in SequelizeMeta
  console.log('Running v2.32 migrations...');
  await sequelize.migrate('up');

  // Remove the post-v2.32 entries — dump should only have squashed migration names
  if (postBaselineMigrations.length > 0) {
    const names = postBaselineMigrations.map(n => `'${n}'`).join(',');
    await sequelize.query(
      `DELETE FROM "SequelizeMeta" WHERE name IN (${names})`,
    );
  }

  const metaCount = await sequelize.query(
    `SELECT count(*) as count FROM "SequelizeMeta"`,
    { type: sequelize.QueryTypes.SELECT },
  );
  console.log(
    `SequelizeMeta contains ${metaCount[0].count} entries (squashed migrations only)`,
  );

  // Dump the database
  console.log('Dumping database...');
  const pgDumpArgs = [
    `--dbname=${DB_NAME}`,
    '--no-owner',
    '--no-privileges',
    '--no-tablespaces',
    // Include schema + data (migration-seeded data must be preserved)
    // --inserts for portability and readability of data rows
    '--inserts',
  ];

  if (dbConfig.host) pgDumpArgs.push(`--host=${dbConfig.host}`);
  if (dbConfig.port) pgDumpArgs.push(`--port=${dbConfig.port}`);
  if (dbConfig.username) pgDumpArgs.push(`--username=${dbConfig.username}`);

  const env = { ...process.env };
  if (dbConfig.password) env.PGPASSWORD = dbConfig.password;

  const pgDumpBin = process.env.PG_DUMP_PATH || 'pg_dump';
  const sql = execSync(`${pgDumpBin} ${pgDumpArgs.join(' ')}`, {
    env,
    maxBuffer: 100 * 1024 * 1024,
  }).toString();

  // Post-process: Umzug creates SequelizeMeta before migrations run,
  // so strip the CREATE TABLE for it (keep INSERTs).
  const processed = sql
    .replace(
      /--\n-- Name: SequelizeMeta; Type: TABLE[\s\S]*?;\n\n/g,
      '',
    )
    .replace(
      /--\n-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT[\s\S]*?;\n\n/g,
      '',
    );

  // Write the baseline SQL
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, processed);
  console.log(`Baseline SQL written to ${OUTPUT_PATH}`);
  console.log(`Size: ${(Buffer.byteLength(sql) / 1024 / 1024).toFixed(2)} MB`);

  await sequelize.close();
  console.log('Done.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
