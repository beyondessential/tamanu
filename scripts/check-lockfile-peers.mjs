#!/usr/bin/env node
/**
 * Check that package-lock.json does not lean on npm installing peer
 * dependencies implicitly: no package may be in the tree only because something
 * declared it as a peer (lockfile `"peer": true`). `--legacy-peer-deps` drops
 * those, so they must be declared by the workspace that uses the package asking
 * for them.
 *
 * With `--baseline <lockfile>`, also fail when a required peer dependency that
 * resolves to a version in its range in the baseline no longer does. This guards
 * a lockfile rewritten with `--legacy-peer-deps`, which neither installs new
 * peers nor keeps implicit ones, and hoists packages past the copy of a peer
 * they need.
 *
 * Usage: node scripts/check-lockfile-peers.mjs [--baseline <lockfile>] [lockfile]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, posix } from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  options: { baseline: { type: 'string' } },
  allowPositionals: true,
});

function readPackages(lockfilePath) {
  return JSON.parse(readFileSync(lockfilePath, 'utf8')).packages;
}

function resolveFrom(packages, location, name) {
  let directory = location;
  for (;;) {
    const resolved = packages[posix.join(directory, 'node_modules', name)];
    if (resolved) return resolved;
    if (directory === '' || directory === '.') return null;
    directory = posix.dirname(directory);
  }
}

// CI runs this without installing dependencies, so it borrows the semver that npm ships with
function loadSemver() {
  const globalModules = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
  return createRequire(join(globalModules, 'npm', 'package.json'))('semver');
}

// Keyed by package name and range rather than location or resolved version, so a
// package moving within the tree between two lockfiles doesn't read as a new problem.
function findUnmetPeers(packages, semver) {
  return new Set(
    Object.entries(packages).flatMap(([location, entry]) => {
      if (entry.link) return [];
      const dependentName = location.split('node_modules/').at(-1) || location;
      return Object.entries(entry.peerDependencies ?? {})
        .filter(([name]) => !entry.peerDependenciesMeta?.[name]?.optional)
        .flatMap(([name, range]) => {
          const resolved = resolveFrom(packages, location, name);
          if (!resolved) return [`${name}, required by ${dependentName}, is missing`];
          const isCheckable = resolved.version && semver.validRange(range);
          if (
            isCheckable &&
            !semver.satisfies(resolved.version, range, { includePrerelease: true })
          ) {
            return [`${name}@${range}, required by ${dependentName}, is out of range`];
          }
          return [];
        });
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
  const semver = loadSemver();
  const unmetInBaseline = findUnmetPeers(readPackages(values.baseline), semver);
  const newlyUnmet = [...findUnmetPeers(packages, semver)].filter(
    peer => !unmetInBaseline.has(peer),
  );
  if (newlyUnmet.length) {
    failed = true;
    console.error('Required peer dependencies no longer met:');
    for (const peer of newlyUnmet) console.error(`  ${peer}`);
  }
}

if (failed) process.exit(1);
