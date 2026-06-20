#!/usr/bin/env node
/**
 * Point a package's `exports`/`main` at its `src` source (extension-less), so it runs
 * build-less under the `tsx` loader (which transforms .ts/.tsx/.js/.jsx on the fly and
 * resolves extensions). No source edits, no per-extension export maps — `./*` ->
 * `./src/*` lets tsx resolve `.ts`/`.js`/`.jsx`/`/index.*` uniformly.
 *
 * Edits package.json only: sets "type": "module", maps exports/main to ./src/* with no
 * extension, and drops the build scripts.
 *
 * Usage: node scripts/source-exports.mjs <packageDir ...>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packages = process.argv.slice(2);
if (!packages.length) {
  console.error('Usage: node scripts/source-exports.mjs <packageDir ...>');
  process.exit(1);
}

/** ./dist/{esm,cjs,mjs}/X/index.js | X.js  ->  ./src/X (extension-less) */
const toSrc = t =>
  typeof t === 'string' && /^\.\/dist\/(esm|cjs|mjs)\//.test(t)
    ? t.replace(/^\.\/dist\/(esm|cjs|mjs)\//, './src/').replace(/\/index\.js$/, '').replace(/\.js$/, '')
    : t;

const mapEntry = v => (typeof v === 'string' ? toSrc(v) : toSrc(v.import ?? v.require ?? v.default) ?? v);

for (const dir of packages) {
  const p = resolve(dir, 'package.json');
  const pkg = JSON.parse(readFileSync(p, 'utf8'));

  pkg.type = 'module';
  if (pkg.main) pkg.main = toSrc(pkg.main) === pkg.main ? './src/index' : toSrc(pkg.main);
  if (pkg.module) delete pkg.module;
  if (pkg.types) delete pkg.types;

  if (pkg.exports && typeof pkg.exports === 'object') {
    for (const [k, v] of Object.entries(pkg.exports)) pkg.exports[k] = mapEntry(v);
  }
  if (pkg.scripts) {
    for (const n of Object.keys(pkg.scripts)) {
      if (n === 'build' || n === 'clean-build' || n.startsWith('build:') || n === 'build-watch') delete pkg.scripts[n];
    }
  }

  writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`${dir}: exports -> src (extension-less), build scripts removed`);
}
