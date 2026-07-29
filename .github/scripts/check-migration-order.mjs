#!/usr/bin/env node
// Fail when a branch adds a server migration that doesn't sort last, or that is dated in the
// future.
//
// Umzug reads the migrations directory with `pattern: /^\d+[\w-]+\.(js|ts)$/` and runs the matching
// files in lexical order (see packages/database/src/services/migrations/migrations.js), so lexical
// order is the canonical order and this check compares filenames as strings. A migration that
// sorts below one already on the target branch runs before its neighbours on a fresh database and
// after them on a database that has already upgraded, so the two diverge.
//
// Only the files a branch adds are checked; the order of the migrations already on the target
// branch is taken as given.

import { execFileSync } from 'node:child_process';
import { readFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import {
  MIGRATION_PATTERN,
  MIGRATIONS_DIR,
  lastMigration,
  nextPrefix,
  prefixOf,
} from '../../scripts/migration-names.mjs';

// A new migration may be dated this far past the later of now and the last existing migration:
// enough for a DDL/DML/DDL set spaced a second apart, without letting a mistyped prefix through.
const FUTURE_SLACK_MS = 60_000;

const FIX_HINT = 'npm run check-migration-order -- --fix';

const EXEMPTION_MARKER = /MIGRATION-ORDER-EXEMPT:?[ \t]*(.*)/;

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function gitLines(args) {
  return git(args).split('\n').filter(Boolean);
}

function refExists(ref) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function readEventPayload() {
  if (!process.env.GITHUB_EVENT_PATH) return null;
  try {
    return JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

// The base is never hardcoded: a hotfix PR targets a release branch, and must be measured against
// that branch rather than main.
function resolveBase(explicit) {
  if (explicit) {
    if (!refExists(explicit)) throw new Error(`--base ${explicit} is not a commit`);
    return explicit;
  }

  // On pull_request the remote-tracking branch is the target branch as it stands now, which is
  // stricter than the base sha recorded when the PR last synced.
  const baseRef = process.env.GITHUB_BASE_REF;
  if (baseRef && refExists(`origin/${baseRef}`)) return `origin/${baseRef}`;

  // GITHUB_BASE_REF is only set for pull_request events, so merge_group comes from the payload.
  const payload = readEventPayload();
  const sha = payload?.pull_request?.base?.sha ?? payload?.merge_group?.base_sha;
  if (sha && refExists(sha)) return sha;

  for (const fallback of ['origin/main', 'main']) {
    if (refExists(fallback)) return fallback;
  }

  throw new Error('could not work out the base branch to compare against; pass --base <ref>');
}

function migrationNamesOn(ref) {
  return gitLines(['ls-tree', '-r', '--name-only', ref, '--', MIGRATIONS_DIR])
    .map(file => path.posix.basename(file))
    .filter(name => MIGRATION_PATTERN.test(name));
}

function addedMigrations(base) {
  const committed = gitLines([
    'diff',
    '--diff-filter=A',
    // Rename detection is on by default, which would hide a migration renamed from an existing
    // one behind an R status. A rename has to land at the end too, so treat it as an addition.
    '--no-renames',
    '--name-only',
    `${base}...HEAD`,
    '--',
    MIGRATIONS_DIR,
  ]);

  // Files that aren't committed yet count too, so that running this (and --fix) before committing
  // does something useful. In CI the tree is clean, so this finds nothing.
  const uncommitted = gitLines([
    'status',
    '--porcelain',
    '--untracked-files=all',
    '--',
    MIGRATIONS_DIR,
  ])
    .filter(line => /^(\?\?|A[ MD]|.A)/.test(line))
    .map(line => line.slice(3).trim());

  return [...new Set([...committed, ...uncommitted])]
    .filter(file => MIGRATION_PATTERN.test(path.posix.basename(file)))
    .sort();
}

// A migration authored on a release branch keeps its filename when it's propagated to main: it is
// recorded under that name in SequelizeMeta on every deployment running the release, and renaming
// it here would make the same migration run a second time when they upgrade.
//
// Built on first use (ie only when something is already failing) and cached: one tree read per
// release branch, rather than one lookup per branch per failing migration.
let releasedNamesCache;
function releasedNames() {
  if (releasedNamesCache) return releasedNamesCache;

  releasedNamesCache = new Map();
  const refs = gitLines([
    'for-each-ref',
    '--format=%(refname:short)',
    'refs/remotes/origin/release/*',
    'refs/heads/release/*',
  ]);
  for (const ref of refs) {
    for (const name of migrationNamesOn(ref)) {
      if (!releasedNamesCache.has(name)) releasedNamesCache.set(name, ref);
    }
  }
  return releasedNamesCache;
}

function markedExempt(file) {
  let contents;
  try {
    contents = readFileSync(file, 'utf8');
  } catch {
    try {
      contents = git(['show', `HEAD:${file}`]);
    } catch {
      return null;
    }
  }
  const marker = contents.match(EXEMPTION_MARKER);
  if (!marker) return null;
  return marker[1].trim() || 'no reason given';
}

function exemptionFor(file, name) {
  const reason = markedExempt(file);
  if (reason) return `marked exempt: ${reason}`;

  const ref = releasedNames().get(name);
  if (ref) return `already on ${ref}, so it must keep its name`;

  return null;
}

function formatDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function violationFor(name, { base, last, latestAllowed }) {
  if (last && name < last) {
    return (
      `${name} sorts before ${last}, which is already on ${base}.\n` +
      `   New migrations must sort last. Fix: ${FIX_HINT}`
    );
  }

  const prefix = prefixOf(name);
  if (prefix > latestAllowed) {
    return (
      `${name} is dated ${formatDate(prefix)}, in the future.\n` +
      `   Use the current time: ${FIX_HINT}`
    );
  }

  return null;
}

function annotate(level, file, message) {
  // Annotations are single-line; %0A is how Actions encodes a newline in one.
  const encoded = message.replace(/\r?\n\s*/g, '%0A');
  console.log(`::${level} file=${file},line=1,title=Migration order::${encoded}`);
}

function report(violations, base) {
  for (const { file, message } of violations) {
    console.error(`\n❌ ${message}`);
    if (process.env.CI) annotate('error', file, message);
  }
  console.error(
    `\n${violations.length} new migration${violations.length === 1 ? '' : 's'} to rename, ` +
      `checked against ${base}.`,
  );
}

function isTracked(file) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', file], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function move(from, to) {
  // git mv keeps the index in step, but only works on files git already knows about — a migration
  // that hasn't been committed yet is just a file on disk.
  if (isTracked(from)) {
    git(['mv', from, to]);
  } else {
    renameSync(from, to);
  }
}

// A handful of migrations mention another migration's timestamp in a comment, and nothing updates
// those for us.
function warnAboutReferences(prefix, renamed) {
  let hits;
  try {
    hits = gitLines(['grep', '--untracked', '-l', '--fixed-strings', String(prefix)]);
  } catch {
    return; // git grep exits non-zero when it finds nothing
  }

  const others = hits.filter(file => file !== renamed);
  if (others.length === 0) return;

  console.log(`  ${prefix} is still mentioned in:`);
  for (const file of others) console.log(`    ${file}`);
}

function fix(violations, lastPrefix) {
  // Rename in lexical order, so a DDL/DML/DDL set keeps its relative order at the new prefixes.
  const ordered = [...violations].sort((a, b) => a.name.localeCompare(b.name));

  let prefix = lastPrefix;
  for (const { file, name } of ordered) {
    prefix = nextPrefix(prefix);
    const renamed = path.posix.join(path.posix.dirname(file), name.replace(/^\d+/, prefix));
    move(file, renamed);
    console.log(`Renamed ${name} -> ${path.posix.basename(renamed)}`);
    warnAboutReferences(prefixOf(name), renamed);
  }

  console.log(
    `\n✔ Renamed ${ordered.length} migration${ordered.length === 1 ? '' : 's'}. ` +
      'Check the diff and commit it.',
  );
}

function main(argv) {
  const { values } = parseArgs({
    args: argv.slice(2),
    options: {
      help: { type: 'boolean', short: 'h', default: false },
      base: { type: 'string' },
      fix: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    console.log(
      'Usage: check-migration-order [--base <ref>] [--fix]\n\n' +
        'Checks that migrations added since <ref> sort after every migration on it, and are not\n' +
        'dated in the future. Defaults to the PR base branch in CI, or origin/main locally.',
    );
    return 0;
  }

  const event = process.env.GITHUB_EVENT_NAME;
  if (event && !['pull_request', 'merge_group', 'workflow_dispatch'].includes(event)) {
    console.log(`Nothing to check on a ${event} event: the migrations have already landed.`);
    return 0;
  }

  const base = resolveBase(values.base ?? null);

  const last = lastMigration(migrationNamesOn(base));
  const lastPrefix = last ? prefixOf(last) : 0;

  const added = addedMigrations(base);
  if (added.length === 0) {
    console.log(`No new migrations added since ${base}.`);
    return 0;
  }

  // Ordering wins over the future rule: an existing migration can't be renamed, so if the last one
  // is itself future-dated, new migrations have to be dated past it.
  const latestAllowed = Math.max(Date.now(), lastPrefix) + FUTURE_SLACK_MS;
  if (lastPrefix > Date.now() + FUTURE_SLACK_MS) {
    console.log(
      `Note: the last migration on ${base}, ${last}, is dated ${formatDate(lastPrefix)}, in the ` +
        `future. New migrations must still sort after it, so they may be dated up to ` +
        `${formatDate(latestAllowed)}.`,
    );
  }

  const violations = [];
  const exempted = [];
  for (const file of added) {
    const name = path.posix.basename(file);
    const message = violationFor(name, { base, last, latestAllowed });
    if (!message) continue;

    const exemption = exemptionFor(file, name);
    if (exemption) {
      exempted.push(`${name} — ${exemption}`);
      continue;
    }

    violations.push({ file, name, message });
  }

  for (const note of exempted) {
    console.log(`Skipping ${note}.`);
  }

  if (violations.length > 0) {
    if (values.fix) {
      fix(violations, lastPrefix);
      return 0;
    }

    report(violations, base);
    return 1;
  }

  const one = added.length === 1;
  console.log(
    `✔ ${added.length} new migration${one ? '' : 's'} sort${one ? 's' : ''} after ` +
      `${last ?? '(none)'}, the last one on ${base}.`,
  );
  return 0;
}

try {
  process.exitCode = main(process.argv);
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exitCode = 1;
}
