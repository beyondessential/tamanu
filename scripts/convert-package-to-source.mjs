#!/usr/bin/env node
/**
 * Convert a package to build-less: consumed directly from `src` (TypeScript/JS),
 * run by Node's native type stripping (and the JSX register hook for .jsx/.tsx),
 * with no dist build.
 *
 * Edits package.json only (the deliberate, reviewable part):
 *   - sets "type": "module"
 *   - rewrites "main"/"exports" to point at the real ./src file (extension-aware:
 *     resolves .ts/.tsx/.js/.jsx, including /index.*), instead of ./dist/**
 *   - drops the build/clean-build/build:* scripts
 *
 * Wildcard exports (./*) can't be probed, so they keep a .ts target as a best-effort
 * default and are reported — review those for packages with non-.ts source.
 *
 * Usage: node scripts/convert-package-to-source.mjs <packageDir ...>
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packages = process.argv.slice(2);
if (!packages.length) {
  console.error('Usage: node scripts/convert-package-to-source.mjs <packageDir ...>');
  process.exit(1);
}
const EXTS = ['.ts', '.tsx', '.js', '.jsx'];

/** Map a built target (./dist/{esm,cjs,mjs}/X.js) to the real ./src source file. */
function toSource(pkgDir, target) {
  if (typeof target !== 'string' || !/^\.\/dist\/(esm|cjs|mjs)\//.test(target)) return target;
  const bare = target.replace(/^\.\/dist\/(esm|cjs|mjs)\//, './src/').replace(/\.js$/, '');
  if (bare.includes('*')) return { wildcard: `${bare}.ts` };
  for (const ext of EXTS) if (existsSync(resolve(pkgDir, `${bare}${ext}`))) return `${bare}${ext}`;
  for (const ext of EXTS) if (existsSync(resolve(pkgDir, `${bare}/index${ext}`))) return `${bare}/index${ext}`;
  return { missing: `${bare}.ts` };
}

function indexSource(pkgDir) {
  for (const ext of EXTS) if (existsSync(resolve(pkgDir, `src/index${ext}`))) return `./src/index${ext}`;
  return './src/index.ts';
}

for (const pkgDir of packages) {
  const pkgPath = resolve(pkgDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const warnings = [];

  pkg.type = 'module';
  const idx = indexSource(pkgDir);
  if (pkg.main) pkg.main = idx;
  if (pkg.module) delete pkg.module;
  if (pkg.types) pkg.types = idx;

  const mapEntry = (subpath, value) => {
    const raw = typeof value === 'string' ? value : (value.import ?? value.require ?? value.default);
    const mapped = toSource(pkgDir, raw);
    if (mapped && mapped.wildcard) {
      warnings.push(`${subpath} (wildcard -> ${mapped.wildcard}, review for non-.ts source)`);
      return mapped.wildcard;
    }
    if (mapped && mapped.missing) {
      warnings.push(`${subpath} -> no source found, left ${mapped.missing}`);
      return mapped.missing;
    }
    return mapped ?? value;
  };

  if (pkg.exports && typeof pkg.exports === 'object') {
    for (const [subpath, value] of Object.entries(pkg.exports)) {
      pkg.exports[subpath] = mapEntry(subpath, value);
    }
  }

  if (pkg.scripts) {
    for (const name of Object.keys(pkg.scripts)) {
      if (name === 'build' || name === 'clean-build' || name.startsWith('build:') || name === 'build-watch') {
        delete pkg.scripts[name];
      }
    }
  }

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`${pkgDir}: converted (type:module, exports->src, build scripts removed)`);
  for (const w of warnings) console.log(`    ⚠ ${w}`);
}
