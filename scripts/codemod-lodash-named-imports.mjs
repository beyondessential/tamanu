#!/usr/bin/env node
/**
 * Codemod: point lodash imports at es-toolkit/compat.
 *
 *   import { isNil, inRange } from 'lodash';   ->   import { isNil, inRange } from 'es-toolkit/compat';
 *   const _ = require('lodash');               ->   const _ = require('es-toolkit/compat');
 *
 * lodash is CommonJS and does not expose statically-detectable named exports, so
 * `import { x } from 'lodash'` fails under native ESM (the swc->CJS build hid this).
 * es-toolkit/compat is a lodash-compatible ESM build with real named exports, so the
 * named imports resolve cleanly under the tsx loader with no other change. This is a
 * pure specifier rename on the raw file text — it touches nothing else — and is
 * idempotent.
 *
 * A few sites need follow-up after this rename (handled by hand in the fixes PR, not
 * here): `import _ from 'lodash'` / `require('lodash')` (es-toolkit/compat has no
 * aggregate default export, so those revert to lodash) and `chain` (es-toolkit drops
 * the chaining API, so that one site stays on lodash-es).
 *
 * Usage: node scripts/codemod-lodash-named-imports.mjs [packageDir ...]
 * Defaults to every package under packages/.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'build', 'coverage']);

const roots = process.argv.slice(2);
const searchRoots = roots.length ? roots : ['packages'];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      yield* walk(full);
    } else if (SOURCE_EXTENSIONS.some(ext => entry.endsWith(ext))) {
      yield full;
    }
  }
}

let changedFiles = 0;
for (const root of searchRoots) {
  for (const file of walk(root)) {
    const original = readFileSync(file, 'utf8');
    const rewritten = original
      .replaceAll("from 'lodash'", "from 'es-toolkit/compat'")
      .replaceAll("require('lodash')", "require('es-toolkit/compat')");
    if (rewritten !== original) {
      writeFileSync(file, rewritten);
      changedFiles += 1;
    }
  }
}

console.log(`lodash -> es-toolkit/compat: rewrote ${changedFiles} file(s).`);
