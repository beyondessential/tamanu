// Shared helpers for naming server migrations, used by scripts/create-server-migration.mjs and
// .github/scripts/check-migration-order.mjs.

import { readdirSync } from 'node:fs';

export const MIGRATIONS_DIR = 'packages/database/src/migrations';

// Mirrors the umzug config in packages/database/src/services/migrations/migrations.js: files it
// doesn't match are not run as migrations, so their names don't matter here.
export const MIGRATION_PATTERN = /^\d+[\w-]+\.(js|ts)$/;

export function prefixOf(name) {
  return Number(name.match(/^\d+/)[0]);
}

// Umzug runs migrations in the lexical order of their filenames, so the last name in that order is
// the one a new migration has to beat.
export function lastMigration(names) {
  return (
    names
      .filter(name => MIGRATION_PATTERN.test(name))
      .sort()
      .at(-1) ?? null
  );
}

export function lastMigrationOnDisk(dir = MIGRATIONS_DIR) {
  return lastMigration(readdirSync(dir));
}

// Lexical and numeric order only agree while every prefix has the same number of digits, so refuse
// to mint one that doesn't rather than produce a name that sorts wrong. Date.now() stays at 13
// digits until the year 2286.
export function nextPrefix(afterPrefix = 0) {
  const candidate = Math.max(Date.now(), afterPrefix + 1);
  if (afterPrefix > 0 && String(candidate).length !== String(afterPrefix).length) {
    throw new Error(
      `cannot name a migration after ${afterPrefix}: ${candidate} has a different number of ` +
        'digits, so it would not sort where it needs to',
    );
  }
  return candidate;
}
