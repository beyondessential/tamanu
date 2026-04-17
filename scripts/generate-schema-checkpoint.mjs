/**
 * Generate a schema checkpoint migration.
 *
 * This script:
 * 1. Creates a temporary PostgreSQL database
 * 2. Runs all migrations up to the cutoff point
 * 3. Dumps the schema using pg_dump
 * 4. Writes the checkpoint migration file
 * 5. Deletes old migration files
 * 6. Cleans up the temporary database
 *
 * Prerequisites:
 *   - PostgreSQL running locally (or set PGHOST/PGPORT/PGUSER/PGPASSWORD)
 *   - pg_dump available on PATH
 *   - Project built: npm run build-shared && npm run build --workspace @tamanu/database
 *
 * Usage:
 *   node scripts/generate-schema-checkpoint.mjs
 *
 * Environment variables (optional):
 *   PGHOST     - PostgreSQL host (default: localhost)
 *   PGPORT     - PostgreSQL port (default: 5432)
 *   PGUSER     - PostgreSQL user (default: tamanu)
 *   PGPASSWORD - PostgreSQL password (default: tamanu)
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const TEMP_DB_NAME = 'tamanu_schema_checkpoint_temp';

// The last migration included in the checkpoint (from release/2.22)
const CUTOFF_MIGRATION = '1733366147317-addChequeNumberToInvoicePatientPayment';
const CHECKPOINT_TIMESTAMP = '1733366147318';

const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'packages/database/src/migrations');
const CHECKPOINT_FILE = path.join(
  MIGRATIONS_DIR,
  `${CHECKPOINT_TIMESTAMP}-schemaCheckpoint.ts`,
);

const PGHOST = process.env.PGHOST ?? 'localhost';
const PGPORT = process.env.PGPORT ?? '5432';
const PGUSER = process.env.PGUSER ?? 'tamanu';
const PGPASSWORD = process.env.PGPASSWORD ?? 'tamanu';

function pgClient(database = 'postgres') {
  return new pg.Client({
    host: PGHOST,
    port: Number(PGPORT),
    user: PGUSER,
    password: PGPASSWORD,
    database,
  });
}

async function createTempDb() {
  const client = pgClient();
  await client.connect();
  try {
    await client.query(`DROP DATABASE IF EXISTS "${TEMP_DB_NAME}"`);
    await client.query(`CREATE DATABASE "${TEMP_DB_NAME}"`);
    console.log(`Created temporary database: ${TEMP_DB_NAME}`);
  } finally {
    await client.end();
  }
}

async function dropTempDb() {
  const client = pgClient();
  await client.connect();
  try {
    await client.query(`DROP DATABASE IF EXISTS "${TEMP_DB_NAME}"`);
    console.log(`Dropped temporary database: ${TEMP_DB_NAME}`);
  } finally {
    await client.end();
  }
}

async function runMigrationsUpToCutoff() {
  const { Sequelize } = await import('sequelize');
  const { default: Umzug } = await import('umzug');

  const sequelize = new Sequelize(TEMP_DB_NAME, PGUSER, PGPASSWORD, {
    host: PGHOST,
    port: Number(PGPORT),
    dialect: 'postgres',
    logging: false,
  });

  await sequelize.authenticate();

  const distMigrationsDir = path.join(
    PROJECT_ROOT,
    'packages/database/dist/cjs/migrations',
  );

  const umzug = new Umzug({
    migrations: {
      path: distMigrationsDir,
      params: [sequelize.getQueryInterface()],
      customResolver: async (sqlPath) => {
        const migrationImport = await import(sqlPath);
        const migration =
          'default' in migrationImport ? migrationImport.default : migrationImport;
        if (!('up' in migration)) {
          throw new Error(`Migration ${sqlPath} must export an up function`);
        }
        if (!('down' in migration)) {
          migration.down = () => {};
        }
        return migration;
      },
    },
    storage: 'sequelize',
    storageOptions: { sequelize },
  });

  const cutoffFile = `${CUTOFF_MIGRATION}.js`;
  console.log(`Running migrations up to ${cutoffFile}...`);
  await umzug.up({ to: cutoffFile });
  console.log('Migrations applied successfully.');

  await sequelize.close();
}

function dumpSchema() {
  console.log('Dumping schema...');
  const env = {
    ...process.env,
    PGHOST,
    PGPORT,
    PGUSER,
    PGPASSWORD,
  };

  // Use full dump (schema + data) since some old migrations insert seed data
  // (e.g. sync clock initialisation, system user). On the temp DB this will
  // only be a handful of rows.
  const raw = execSync(
    `pg_dump --no-owner --no-privileges --no-comments --inserts "${TEMP_DB_NAME}"`,
    { env, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
  );

  // Filter out:
  // - SequelizeMeta table (managed by Umzug)
  // - SET statements (session-specific, will be set by the connection)
  // - SELECT statements (e.g. pg_catalog calls)
  // - Empty comments (--)
  const lines = raw.split('\n');
  const filtered = [];
  let skipBlock = false;

  for (const line of lines) {
    // Skip SequelizeMeta-related blocks
    if (line.includes('SequelizeMeta')) {
      skipBlock = true;
      continue;
    }

    // End skip block on empty line
    if (skipBlock && line.trim() === '') {
      skipBlock = false;
      continue;
    }

    if (skipBlock) continue;

    // Skip pg_dump preamble SET statements (session-level config that Sequelize handles)
    // but keep SET search_path and SET default_* which affect schema creation
    if (/^SET\s/.test(line) && !/^SET (search_path|default_)/.test(line)) continue;
    if (/^SELECT\s+pg_catalog\./.test(line)) continue;

    // Skip pure comment lines
    if (/^--/.test(line)) continue;

    filtered.push(line);
  }

  const sql = filtered.join('\n').trim();
  console.log(`Schema dump: ${sql.length} characters`);
  return sql;
}

async function getOldMigrationFilenames() {
  const files = await fs.readdir(MIGRATIONS_DIR);
  const cutoffTimestamp = Number(CUTOFF_MIGRATION.split('-')[0]);

  return files
    .filter((f) => {
      if (f === '000_initial') return false; // skip the helper directory
      // Parse the leading number: could be "000_initial.js" or "1733366147317-name.js"
      const match = f.match(/^(\d+)/);
      if (!match) return false;
      return Number(match[1]) <= cutoffTimestamp;
    })
    .sort();
}

async function writeCheckpointMigration(schemaSql, oldMigrationFilenames) {
  // Escape for embedding in a TS template literal
  const escapedSql = schemaSql
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  // Umzug stores the .js filename (post-build) in SequelizeMeta
  const migrationEntries = oldMigrationFilenames
    .map((name) => `  '${name.replace(/\.ts$/, '.js')}'`)
    .join(',\n');

  const migration = `import type { QueryInterface } from 'sequelize';

// Schema checkpoint: replaces all migrations up to and including
// ${CUTOFF_MIGRATION}
//
// Fresh databases:    creates the full schema in a single migration.
// Existing databases: no-op (the schema already exists from prior migrations).
//
// Generated by: node scripts/generate-schema-checkpoint.mjs

const OLD_MIGRATION_NAMES = [
${migrationEntries},
];

const SCHEMA_SQL = \`
${escapedSql}
\`;

export async function up(query: QueryInterface): Promise<void> {
  const sequelize = query.sequelize;

  // Check whether the schema already exists (i.e. this is an existing deployment)
  const [results] = await sequelize.query(
    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') AS exists",
  );
  const schemaExists = (results as any)[0]?.exists;

  if (schemaExists) {
    // Existing deployment — nothing to do.
    return;
  }

  // Fresh database — create the full schema in one go.
  await sequelize.query(SCHEMA_SQL);

  // Mark all old migrations as applied so the incremental migrations that
  // follow this checkpoint do not try to re-run them.
  if (OLD_MIGRATION_NAMES.length > 0) {
    const values = OLD_MIGRATION_NAMES.map(n => \`('\${n}')\`).join(', ');
    await sequelize.query(
      \`INSERT INTO "SequelizeMeta" (name) VALUES \${values} ON CONFLICT DO NOTHING\`,
    );
  }
}

export async function down(): Promise<void> {
  // Irreversible — cannot undo a full schema checkpoint.
}
`;

  await fs.writeFile(CHECKPOINT_FILE, migration, 'utf8');
  console.log(`Written checkpoint migration: ${path.relative(PROJECT_ROOT, CHECKPOINT_FILE)}`);
}

async function deleteOldMigrations(filenames) {
  console.log(`Deleting ${filenames.length} old migration files...`);

  for (const name of filenames) {
    await fs.rm(path.join(MIGRATIONS_DIR, name), { recursive: true, force: true });
  }

  // Also delete the 000_initial/ helper directory used by 000_initial.js
  await fs.rm(path.join(MIGRATIONS_DIR, '000_initial'), { recursive: true, force: true }).catch(() => {});

  console.log('Done.');
}

async function main() {
  try {
    console.log('=== Schema Checkpoint Generator ===\n');

    // 1. Verify pg_dump is available
    try {
      execSync('pg_dump --version', { stdio: 'pipe' });
    } catch {
      console.error('Error: pg_dump not found on PATH. Install PostgreSQL client tools.');
      process.exit(1);
    }

    // 2. Create temp DB and run migrations
    await createTempDb();
    await runMigrationsUpToCutoff();

    // 3. Dump schema
    const schemaSql = dumpSchema();

    // 4. Collect old migration filenames
    const oldFiles = await getOldMigrationFilenames();
    console.log(`Found ${oldFiles.length} migrations to fold into checkpoint.`);

    // 5. Write checkpoint migration
    await writeCheckpointMigration(schemaSql, oldFiles);

    // 6. Delete old migration files
    await deleteOldMigrations(oldFiles);

    // 7. Cleanup
    await dropTempDb();

    const remaining = (await fs.readdir(MIGRATIONS_DIR)).filter(
      (f) => f !== '000_initial',
    ).length;
    console.log(`\n=== Done! ===`);
    console.log(`Checkpoint: ${path.relative(PROJECT_ROOT, CHECKPOINT_FILE)}`);
    console.log(`Remaining migrations: ${remaining} files`);
    console.log(`\nNext steps:`);
    console.log(`  1. Build: npm run build-shared && npm run build --workspace @tamanu/database`);
    console.log(`  2. Test:  npm run central-test`);
    console.log(`  3. Review the generated checkpoint and commit`);
  } catch (error) {
    console.error('\nFailed:', error.message);
    console.error(error.stack);
    try {
      await dropTempDb();
    } catch {
      /* cleanup */
    }
    process.exit(1);
  }
}

main();
