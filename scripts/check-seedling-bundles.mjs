#!/usr/bin/env node
/**
 * Check that the script files the Seedling definitions share are identical in
 * every bundle. A bundle can read only the files beneath its own folder, and
 * Seedling refuses symlinks, so each shared file is a copy in every bundle.
 *
 * Usage: node scripts/check-seedling-bundles.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const BUNDLES = ['seedling/central', 'seedling/facility'];
const SHARED = ['helpers.rhai', 'params.rhai', 'gates.rhai'];

const failures = SHARED.flatMap(file => {
  const [first, ...rest] = BUNDLES.map(bundle => join(bundle, file));
  const expected = readFileSync(join(ROOT, first));
  return rest
    .filter(copy => !expected.equals(readFileSync(join(ROOT, copy))))
    .map(copy => `${copy} differs from ${first}`);
});

if (failures.length > 0) {
  for (const failure of failures) console.error(failure);
  console.error('\nEdit the shared files in every bundle alike.');
  process.exit(1);
}

console.log(`OK: ${SHARED.length} shared file(s) match across ${BUNDLES.length} bundles.`);
