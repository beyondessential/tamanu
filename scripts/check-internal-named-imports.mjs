#!/usr/bin/env node
/**
 * Validate that every named import from a workspace-internal `@tamanu/*` module
 * actually resolves to an exported binding in the target source file. Under the
 * old CJS build, importing a name that wasn't exported silently produced
 * `undefined`; under native ESM / tsx it is a hard error. This finds all such
 * latent broken imports across the node-run packages so they can be fixed in one
 * pass rather than discovered one boot at a time.
 *
 * Usage: node scripts/check-internal-named-imports.mjs <packageDir ...>
 */
import { Project } from 'ts-morph';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');

// @tamanu/<name> -> absolute package dir, built from packages/*/package.json
const PKG_DIRS = {};
for (const entry of readdirSync(join(ROOT, 'packages'))) {
  const pj = join(ROOT, 'packages', entry, 'package.json');
  if (!existsSync(pj)) continue;
  try {
    const name = JSON.parse(readFileSync(pj, 'utf8')).name;
    if (name?.startsWith('@tamanu/')) PKG_DIRS[name] = join(ROOT, 'packages', entry);
  } catch {
    // ignore unreadable/malformed package.json
  }
}

const dirs = process.argv.slice(2);
if (!dirs.length) {
  console.error('Usage: node scripts/check-internal-named-imports.mjs <packageDir ...>');
  process.exit(1);
}

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  compilerOptions: { allowJs: true, jsx: 2 },
});
for (const dir of dirs) for (const sub of ['src', 'app']) project.addSourceFilesAtPaths(`${resolve(dir)}/${sub}/**/*.{ts,tsx,js,jsx}`);

const EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const resolveModuleFile = base => {
  for (const e of EXTS) if (existsSync(base + e)) return base + e;
  for (const e of EXTS) if (existsSync(join(base, 'index' + e))) return join(base, 'index' + e);
  if (existsSync(base) && /\.[mc]?[jt]sx?$/.test(base)) return base;
  return null;
};

// Resolve `@tamanu/pkg` or `@tamanu/pkg/sub/path` to a source file on disk.
const resolveInternal = spec => {
  const m = spec.match(/^(@tamanu\/[^/]+)(\/(.*))?$/);
  if (!m) return null;
  const pkgDir = PKG_DIRS[m[1]];
  if (!pkgDir) return null;
  const sub = m[3];
  const base = sub ? join(pkgDir, 'src', sub) : join(pkgDir, 'src');
  return resolveModuleFile(base);
};

// Gather exported names of a source file, following `export * from './x'` transitively.
const exportCache = new Map();
const exportsOf = (file, seen = new Set()) => {
  if (exportCache.has(file)) return exportCache.get(file);
  if (seen.has(file)) return new Set();
  seen.add(file);
  let sf = project.getSourceFile(file);
  if (!sf) {
    try { sf = project.addSourceFileAtPath(file); } catch { return new Set(); }
  }
  const names = new Set(sf.getExportedDeclarations().keys());
  // getExportedDeclarations already resolves `export *` and re-exports, but be safe:
  exportCache.set(file, names);
  return names;
};

const problems = [];
for (const sf of project.getSourceFiles()) {
  for (const imp of sf.getImportDeclarations()) {
    const spec = imp.getModuleSpecifierValue();
    if (!spec.startsWith('@tamanu/')) continue;
    const named = imp.getNamedImports().filter(n => !n.isTypeOnly() && !imp.isTypeOnly());
    if (!named.length) continue;
    const target = resolveInternal(spec);
    if (!target) continue; // unresolved (e.g. dist-only / non-source pkg) — skip
    const exp = exportsOf(target);
    if (!exp.size) continue; // couldn't analyse target — skip rather than false-positive
    for (const n of named) {
      const name = n.getName();
      if (name === 'default') continue;
      if (!exp.has(name)) {
        problems.push({ file: sf.getFilePath().replace(ROOT + '/', ''), spec, name, target: target.replace(ROOT + '/', '') });
      }
    }
  }
}

if (!problems.length) {
  console.log('OK: no missing named imports from internal @tamanu/* modules.');
} else {
  for (const p of problems) console.log(`${p.file}\n  imports { ${p.name} } from '${p.spec}'  — not exported by ${p.target}`);
  console.log(`\n${problems.length} missing named import(s).`);
}
