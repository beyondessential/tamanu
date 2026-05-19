#!/usr/bin/env node
// Decide which CI test entries to run for the current event.
//
// On `pull_request` we run a smoke subset:
//   * each test matrix entry runs only if its own package directory was
//     touched
//   * the migrations matrix runs only when a server-migration file was
//     touched
//   * database tests (the `@tamanu/database` test entries and the migrations
//     matrix) are restricted to the latest postgres version
//   * the auxiliary jobs (test-mobile, test-facility-offline, dbt-model,
//     build_shared_cache) are gated to only run when their relevant inputs
//     have changed; flags below tell ci.yml whether each should run
//
// We don't try to resolve transitive dependencies — the full suite runs on
// `merge_group` (and on push), which catches everything else.

import { execSync } from 'node:child_process';
import { appendFileSync, readdirSync, readFileSync } from 'node:fs';

const SERVER_SHARDS = 8;
const MIN_PG_VERSION = 14;
const MAX_PG_VERSION = 18;
const POSTGRES_VERSIONS = Array.from(
  { length: MAX_PG_VERSION - MIN_PG_VERSION + 1 },
  (_, i) => `${MIN_PG_VERSION + i}`,
);

// Packages that have their own CI handling and should not be auto-included
// in the standalone test matrix entries below: facility-server and
// central-server are sharded against postgres, database is run across all
// postgres versions, mobile is tested by `test-mobile`, and e2e-tests runs
// in the dedicated E2E workflow.
const SPECIAL_PACKAGES = new Set([
  '@tamanu/facility-server',
  '@tamanu/central-server',
  '@tamanu/database',
  '@tamanu/mobile',
  '@tamanu/e2e-tests',
]);

// Read every `packages/*/package.json` so we can map names to directories
// and discover which packages have a `test` script (so new packages with
// tests are picked up automatically).
const dirByName = {};
const standalonePackages = [];
for (const dir of readdirSync('packages')) {
  if (dir.startsWith('.')) continue;
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(`packages/${dir}/package.json`, 'utf8'));
  } catch {
    continue;
  }
  if (!pkg.name) continue;
  dirByName[pkg.name] = dir;
  if (pkg.scripts?.test && !SPECIAL_PACKAGES.has(pkg.name)) {
    standalonePackages.push(pkg.name);
  }
}
standalonePackages.sort();

const TEST_FULL = [];
for (let i = 1; i <= SERVER_SHARDS; i++) {
  TEST_FULL.push({ package: '@tamanu/facility-server', shard: `${i}/${SERVER_SHARDS}`, postgres: `${MAX_PG_VERSION}` });
}
for (let i = 1; i <= SERVER_SHARDS; i++) {
  TEST_FULL.push({ package: '@tamanu/central-server', shard: `${i}/${SERVER_SHARDS}`, postgres: `${MAX_PG_VERSION}` });
}
for (const pg of POSTGRES_VERSIONS) {
  TEST_FULL.push({ package: '@tamanu/database', postgres: pg });
}
for (const name of standalonePackages) {
  TEST_FULL.push({ package: name });
}

const MIGRATIONS_FULL = [];
for (const server of ['central-server', 'facility-server']) {
  for (const pg of POSTGRES_VERSIONS) {
    MIGRATIONS_FULL.push({ server, postgres: pg });
  }
}

const event = process.env.GITHUB_EVENT_NAME;
const baseSha = process.env.BASE_SHA;
const headSha = process.env.HEAD_SHA;

let testMatrix = TEST_FULL;
let migrationsMatrix = MIGRATIONS_FULL;
let runMobile = true;
let runFacilityOffline = true;
let runDbtModel = true;

if (event === 'pull_request' && baseSha) {
  const head = headSha || 'HEAD';
  const diff = execSync(`git diff --name-only ${baseSha}...${head}`, { encoding: 'utf8' });
  const files = diff.split('\n').filter(Boolean);

  const touched = new Set();
  for (const f of files) {
    const m = f.match(/^packages\/([^/]+)\//);
    if (m) touched.add(m[1]);
  }

  const migrationsTouched = files.some((f) => f.startsWith('packages/database/src/migrations/'));

  console.error(`Event:              ${event}`);
  console.error(`Touched packages:   ${[...touched].sort().join(', ') || '(none)'}`);
  console.error(`Migrations touched: ${migrationsTouched}`);

  testMatrix = TEST_FULL
    .filter((e) => touched.has(dirByName[e.package]))
    .filter((e) => e.package !== '@tamanu/database' || e.postgres === `${MAX_PG_VERSION}`);
  migrationsMatrix = migrationsTouched
    ? MIGRATIONS_FULL.filter((e) => e.postgres === `${MAX_PG_VERSION}`)
    : [];
  runMobile = touched.has('mobile');
  runFacilityOffline = touched.has('facility-server') || touched.has('central-server');
  runDbtModel = migrationsTouched;
}

const runTest = testMatrix.length > 0;
const runMigrations = migrationsMatrix.length > 0;
// build_shared_cache is the prerequisite for test, migrations, test-mobile,
// and dbt-model — we can skip it entirely when none of those will run.
const runBuildShared = runTest || runMigrations || runMobile || runDbtModel;

// Names match the job IDs in ci.yml. Building the list here keeps it in sync
// with the gating logic above — adding a new gated job means updating both
// the flag and this list in the same place rather than poking ci.yml.
const allowedSkips = [
  !runBuildShared && 'build_shared_cache',
  !runTest && 'test',
  !runMigrations && 'migrations',
  !runMobile && 'test-mobile',
  !runFacilityOffline && 'test-facility-offline',
  !runDbtModel && 'dbt-model',
].filter(Boolean);

console.error(`Run test:                  ${runTest} (${testMatrix.length} entries)`);
console.error(`Run migrations:            ${runMigrations} (${migrationsMatrix.length} entries)`);
console.error(`Run test-mobile:           ${runMobile}`);
console.error(`Run test-facility-offline: ${runFacilityOffline}`);
console.error(`Run dbt-model:             ${runDbtModel}`);
console.error(`Run build_shared_cache:    ${runBuildShared}`);
console.error(`Allowed skips:             ${allowedSkips.join(', ') || '(none)'}`);

const out = process.env.GITHUB_OUTPUT;
if (!out) throw new Error('GITHUB_OUTPUT not set');
appendFileSync(out, `test-matrix=${JSON.stringify({ include: testMatrix })}\n`);
appendFileSync(out, `migrations-matrix=${JSON.stringify({ include: migrationsMatrix })}\n`);
appendFileSync(out, `run-test=${runTest}\n`);
appendFileSync(out, `run-migrations=${runMigrations}\n`);
appendFileSync(out, `run-mobile=${runMobile}\n`);
appendFileSync(out, `run-facility-offline=${runFacilityOffline}\n`);
appendFileSync(out, `run-dbt-model=${runDbtModel}\n`);
appendFileSync(out, `run-build-shared=${runBuildShared}\n`);
appendFileSync(out, `allowed-skips=${allowedSkips.join(',')}\n`);
