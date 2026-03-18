const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const pg = require('pg');

const config = require(path.resolve('packages/database/config/local.json'));
const db = config.db;
const host = db.host || 'localhost';
const port = parseInt(db.port || '5432', 10);
const user = db.username || 'postgres';
const password = db.password || '';
const dbName = process.argv[2] || db.name || 'postgres';

const SNAPSHOT_DIR = path.resolve('packages/database/src/migrations/__snapshot__');
const DUMP_ARGS = '--schema-only --no-owner --no-privileges --no-comments';
const EXEC_OPTS = { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] };

function tryExec(cmd, opts = EXEC_OPTS) {
  try {
    return execSync(cmd, opts);
  } catch {
    return null;
  }
}

function dumpSchema() {
  const localEnv = { ...process.env, PGHOST: host, PGPORT: String(port), PGUSER: user, PGPASSWORD: password };

  // 1. pg_dump on PATH
  let result = tryExec(`pg_dump ${DUMP_ARGS} "${dbName}"`, { ...EXEC_OPTS, env: localEnv });
  if (result) {
    console.log('Using pg_dump from PATH');
    return result;
  }

  // 2. pg_dump from the running server's binary directory
  try {
    const binDir = tryExec(
      `node -e "const c=new(require('pg').Client)({host:'${host}',port:${port},user:'${user}',password:'${password}',database:'postgres'});c.connect().then(()=>c.query(\\"SELECT setting FROM pg_config WHERE name='BINDIR'\\")).then(r=>{console.log(r.rows[0].setting);c.end()}).catch(()=>process.exit(1))"`,
      { ...EXEC_OPTS, env: process.env },
    )?.trim();
    if (binDir) {
      const candidate = path.join(binDir, 'pg_dump');
      if (fs.existsSync(candidate)) {
        result = tryExec(`"${candidate}" ${DUMP_ARGS} "${dbName}"`, { ...EXEC_OPTS, env: localEnv });
        if (result) {
          console.log(`Using pg_dump from server BINDIR: ${candidate}`);
          return result;
        }
      }
    }
  } catch {}

  // 3. Docker: find a postgres container with pg_dump
  const lines = tryExec('docker ps --format "{{.ID}}\\t{{.Image}}"')
    ?.split('\n')
    .filter(l => l.includes('postgres')) || [];

  for (const line of lines) {
    const containerId = line.split('\t')[0];
    if (!tryExec(`docker exec ${containerId} pg_dump --version`)) continue;

    for (const p of [...new Set([port, 5432])]) {
      result = tryExec(
        `docker exec -e PGPASSWORD=${password} ${containerId} pg_dump -h localhost -p ${p} -U ${user} ${DUMP_ARGS} "${dbName}"`,
      );
      if (result) {
        console.log(`Using pg_dump via Docker container ${containerId} (port ${p})`);
        return result;
      }
    }
  }

  return null;
}

(async () => {
  console.log(`==> Connecting to database: ${dbName} (${host}:${port})`);

  const client = new pg.Client({ host, port, user, password, database: dbName });
  await client.connect();

  // Verify SequelizeMeta exists and has entries
  const { rows: metaCheck } = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'SequelizeMeta'
    ) AS "exists"
  `);

  if (!metaCheck[0].exists) {
    console.error(`Error: No SequelizeMeta table found in "${dbName}". Run migrations first.`);
    process.exit(1);
  }

  const { rows: appliedRows } = await client.query(
    'SELECT name FROM "SequelizeMeta" ORDER BY name',
  );

  if (appliedRows.length === 0) {
    console.error(`Error: SequelizeMeta is empty in "${dbName}". Run migrations first.`);
    process.exit(1);
  }

  console.log(`Found ${appliedRows.length} applied migrations.`);
  await client.end();

  // Dump schema
  console.log('==> Dumping schema...');
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

  const schemaSql = dumpSchema();
  if (!schemaSql) {
    console.error(
      'Could not find pg_dump. Install PostgreSQL client tools:\n' +
        '  macOS:   brew install libpq && brew link --force libpq\n' +
        '  Ubuntu:  sudo apt-get install postgresql-client\n' +
        'Or ensure Docker is running with a postgres container.',
    );
    process.exit(1);
  }
  fs.writeFileSync(path.join(SNAPSHOT_DIR, 'schema.sql'), schemaSql);

  // Write applied.json
  console.log('==> Generating applied.json...');
  const applied = appliedRows.map(r => r.name);
  fs.writeFileSync(
    path.join(SNAPSHOT_DIR, 'applied.json'),
    JSON.stringify(applied, null, 2) + '\n',
  );

  console.log(`==> Snapshot generated: ${applied.length} migrations captured`);
  console.log(`    ${SNAPSHOT_DIR}/schema.sql`);
  console.log(`    ${SNAPSHOT_DIR}/applied.json`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
