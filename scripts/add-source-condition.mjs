#!/usr/bin/env node
/**
 * Add a `source` export condition to packages so bundlers (vite) can consume the
 * TypeScript source directly for instant HMR, while Node/jest/swc keep resolving to
 * the built `dist` via the existing `import`/`require` conditions.
 *
 * For each entry in a package's `exports` map it derives the source path from the
 * existing target (`./dist/{esm,cjs,mjs}/X.js` -> `./src/X.ts`) and inserts `source`
 * as the first condition. Idempotent: entries that already have `source` are skipped,
 * and entries whose derived source file does not exist on disk are left untouched.
 *
 * Usage: node scripts/add-source-condition.mjs <packageDir ...>
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packages = process.argv.slice(2);
if (!packages.length) {
  console.error('Usage: node scripts/add-source-condition.mjs <packageDir ...>');
  process.exit(1);
}

/** Turn a built target into its TS source equivalent, or null if it isn't a dist path. */
function toSource(target) {
  if (typeof target !== 'string' || !/^\.\/dist\/(esm|cjs|mjs)\//.test(target)) return null;
  return target.replace(/^\.\/dist\/(esm|cjs|mjs)\//, './src/').replace(/\.js$/, '.ts');
}

for (const pkgDir of packages) {
  const pkgPath = resolve(pkgDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  if (!pkg.exports || typeof pkg.exports !== 'object') {
    console.warn(`${pkgDir}: no exports map — skipped (add one manually if needed)`);
    continue;
  }

  let added = 0;
  let skipped = 0;
  for (const [subpath, value] of Object.entries(pkg.exports)) {
    if (typeof value !== 'object' || value === null) continue; // string target: leave
    if ('source' in value) continue; // idempotent
    const src = toSource(value.import ?? value.require ?? value.default);
    if (!src) continue;
    // For concrete (non-wildcard) paths, only add when the source actually exists.
    if (!src.includes('*') && !existsSync(resolve(pkgDir, src))) {
      console.warn(`${pkgDir}: ${subpath} -> ${src} missing, left dist-only`);
      skipped += 1;
      continue;
    }
    // Reinsert with `source` first so it takes precedence in resolvers that honour it.
    pkg.exports[subpath] = { source: src, ...value };
    added += 1;
  }

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`${pkgDir}: added source to ${added} entr${added === 1 ? 'y' : 'ies'}${skipped ? `, skipped ${skipped}` : ''}`);
}
