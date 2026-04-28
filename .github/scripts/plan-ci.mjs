#!/usr/bin/env node
// Decide which CI test entries to run for the current event.
//
// On `pull_request` we run a smoke subset: each test matrix entry runs only
// if its own package directory was touched. We don't try to resolve transitive
// dependencies — the full suite runs on `merge_group` (and on push), which
// catches everything else.
//
// If the smoke subset would be empty we emit a single `{ skip }` entry so
// the job still runs (and reports success).

import { execSync } from 'node:child_process';
import { appendFileSync, readdirSync, readFileSync } from 'node:fs';

const TEST_FULL = [];
for (let i = 1; i <= 8; i++) {
  TEST_FULL.push({ package: '@tamanu/facility-server', shard: `${i}/8`, postgres: '17' });
}
for (let i = 1; i <= 8; i++) {
  TEST_FULL.push({ package: '@tamanu/central-server', shard: `${i}/8`, postgres: '17' });
}
for (const pg of ['12', '14', '16', '17', '18']) {
  TEST_FULL.push({ package: '@tamanu/database', postgres: pg });
}
TEST_FULL.push(
  { package: '@tamanu/settings' },
  { package: '@tamanu/shared' },
  { package: '@tamanu/upgrade' },
  { package: '@tamanu/utils' },
  { package: '@tamanu/web-frontend' },
);

const event = process.env.GITHUB_EVENT_NAME;
const baseSha = process.env.BASE_SHA;
const headSha = process.env.HEAD_SHA;

let testMatrix = TEST_FULL;

if (event === 'pull_request' && baseSha) {
  const dirByName = {};
  for (const dir of readdirSync('packages')) {
    try {
      const pkg = JSON.parse(readFileSync(`packages/${dir}/package.json`, 'utf8'));
      if (pkg.name) dirByName[pkg.name] = dir;
    } catch {
      // ignore non-package directories
    }
  }

  const head = headSha || 'HEAD';
  const diff = execSync(`git diff --name-only ${baseSha}...${head}`, { encoding: 'utf8' });
  const files = diff.split('\n').filter(Boolean);

  const touched = new Set();
  for (const f of files) {
    const m = f.match(/^packages\/([^/]+)\//);
    if (m) touched.add(m[1]);
  }

  console.error(`Event:            ${event}`);
  console.error(`Touched packages: ${[...touched].sort().join(', ') || '(none)'}`);

  testMatrix = TEST_FULL.filter((e) => touched.has(dirByName[e.package]));
}

if (testMatrix.length === 0) {
  testMatrix = [{ skip: 'no relevant package changes' }];
}

console.error(`Test matrix entries: ${testMatrix.length}`);

const out = process.env.GITHUB_OUTPUT;
if (!out) throw new Error('GITHUB_OUTPUT not set');
appendFileSync(out, `test-matrix=${JSON.stringify({ include: testMatrix })}\n`);
