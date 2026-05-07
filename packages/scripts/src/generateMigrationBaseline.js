#!/usr/bin/env node

/**
 * Generates a SQL baseline snapshot of the database schema at a given tag.
 * Runs only migrations present at that tag, then pg_dumps the result.
 */

const { execSync } = require('child_process');
const fs = require('node:fs');
const path = require('node:path');

const DB_NAME = 'tamanu-baseline-generator';
const BASELINE_TAG = 'v2.41.5';
const OUTPUT_PATH = path.resolve(
  __dirname,
  '../../database/src/migrations/000_baseline.sql',
);

function getPostBaselineMigrations() {
  const baselineFiles = new Set(
    execSync(
      `git ls-tree --name-only ${BASELINE_TAG} -- packages/database/src/migrations/`,
    )
      .toString()
      .trim()
      .split('\n')
      .map(p => p.replace('packages/database/src/migrations/', ''))
      .filter(f => f && f !== '000_initial'),
  );

  const distDir = path.resolve(__dirname, '../../database/dist/cjs/migrations');
  const currentFiles = fs
    .readdirSync(distDir)
    .filter(f => f.endsWith('.js'));

  const baselineJsNames = new Set(
    [...baselineFiles].map(f => f.replace(/\.ts$/, '.js')),
  );

  return currentFiles.filter(f => !baselineJsNames.has(f) && !f.startsWith('000_baseline'));
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

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
      name VARCHAR(255) NOT NULL PRIMARY KEY
    );
  `);

  // Skip only migrations that come AFTER BASELINE_TAG. The existing
  // 000_baseline.js in the working tree must still run so its frozen schema
  // (e.g. the v2.32.9 snapshot) is applied before the intermediate migrations.
  const postBaselineMigrations = getPostBaselineMigrations();
  console.log(
    `Pre-populating SequelizeMeta with ${postBaselineMigrations.length} migration names to skip`,
  );

  if (postBaselineMigrations.length > 0) {
    await sequelize.query(
      `INSERT INTO "SequelizeMeta" (name) SELECT unnest($1::text[])`,
      { bind: [postBaselineMigrations] },
    );
  }

  console.log(`Running ${BASELINE_TAG} migrations...`);
  await sequelize.migrate('up');

  if (postBaselineMigrations.length > 0) {
    await sequelize.query(
      `DELETE FROM "SequelizeMeta" WHERE name = ANY($1::text[])`,
      { bind: [postBaselineMigrations] },
    );
  }

  const metaCount = await sequelize.query(
    `SELECT count(*) as count FROM "SequelizeMeta"`,
    { type: sequelize.QueryTypes.SELECT },
  );
  console.log(
    `SequelizeMeta contains ${metaCount[0].count} entries (squashed migrations only)`,
  );

  console.log('Dumping database...');
  const pgDumpArgs = [
    `--dbname=${DB_NAME}`,
    '--no-owner',
    '--no-privileges',
    '--no-tablespaces',
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

  // Strip SequelizeMeta DDL/data from the dump — the baseline migration
  // handles those entries via Sequelize inside Umzug's transaction.
  const processed = sql
    .replace(
      /--\n-- Name: SequelizeMeta; Type: TABLE[^]*?;\n\n/,
      '',
    )
    .replace(
      /--\n-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT[^]*?;\n\n/,
      '',
    )
    .replace(
      /--\n-- Data for Name: SequelizeMeta;[^]*?(?=\n\n--)/,
      '',
    );

  const metaNames = [];
  const metaRegex = /INSERT INTO public\."SequelizeMeta" VALUES \('([^']+)'\)/g;
  let match;
  while ((match = metaRegex.exec(sql)) !== null) {
    // Skip the baseline itself — Umzug records it when it runs, so including
    // it in the frozen list would cause a duplicate-key error on fresh installs.
    if (match[1].startsWith('000_baseline')) continue;
    metaNames.push(match[1]);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, processed);
  console.log(`Baseline SQL written to ${OUTPUT_PATH}`);
  console.log(`Size: ${(Buffer.byteLength(processed) / 1024 / 1024).toFixed(2)} MB`);

  const metaPath = OUTPUT_PATH.replace('.sql', '_frozen_migrations.json');
  fs.writeFileSync(metaPath, JSON.stringify(metaNames, null, 2));
  console.log(`Frozen migration names (${metaNames.length}) written to ${metaPath}`);

  await sequelize.close();
  console.log('Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
