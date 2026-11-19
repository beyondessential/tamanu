#!/usr/bin/env node
/**
 * Check that package-lock.json does not lean on npm installing peer
 * dependencies implicitly: no package may be in the tree only because something
 * declared it as a peer (lockfile `"peer": true`). `--legacy-peer-deps` drops
 * those, so they must be declared by the workspace that uses the package asking
 * for them.
 *
 * With `--baseline <lockfile>`, also fail when a required peer dependency that
 * resolves in the baseline no longer resolves. This guards a lockfile rewritten
 * with `--legacy-peer-deps`, which neither installs new peers nor keeps implicit
 * ones. Only presence is checked, not whether the version satisfies the range.
 *
 * Usage: node scripts/check-lockfile-peers.mjs [--baseline <lockfile>] [lockfile]
 */
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  options: { baseline: { type: 'string' } },
  allowPositionals: true,
});

function readPackages(lockfilePath) {
  return JSON.parse(readFileSync(lockfilePath, 'utf8')).packages;
}

function resolvesFrom(packages, location, name) {
  let directory = location;
  for (;;) {
    if (packages[posix.join(directory, 'node_modules', name)]) return true;
    if (directory === '' || directory === '.') return false;
    directory = posix.dirname(directory);
  }
}

// Keyed by package name rather than location, so a package moving within the
// tree between two lockfiles doesn't read as a new missing peer.
function findMissingPeers(packages) {
  return new Set(
    Object.entries(packages).flatMap(([location, entry]) => {
      if (entry.link) return [];
      const dependentName = location.split('node_modules/').at(-1) || location;
      return Object.keys(entry.peerDependencies ?? {})
        .filter(name => !entry.peerDependenciesMeta?.[name]?.optional)
        .filter(name => !resolvesFrom(packages, location, name))
        .map(name => `${name}, required by ${dependentName}`);
    }),
  );
}

const packages = readPackages(positionals[0] ?? 'package-lock.json');
let failed = false;

const implicitPeers = Object.keys(packages).filter(location => packages[location].peer);
if (implicitPeers.length) {
  failed = true;
  console.error(
    'Packages installed only as an implicit peer; declare them in the workspace that needs them:',
  );
  for (const location of implicitPeers) console.error(`  ${location}`);
}

if (values.baseline) {
  const missingInBaseline = findMissingPeers(readPackages(values.baseline));
  const newlyMissing = [...findMissingPeers(packages)].filter(peer => !missingInBaseline.has(peer));
  if (newlyMissing.length) {
    failed = true;
    console.error('Required peer dependencies no longer in the tree:');
    for (const peer of newlyMissing) console.error(`  ${peer}`);
  }
}

if (failed) process.exit(1);
