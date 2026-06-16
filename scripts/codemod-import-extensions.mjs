#!/usr/bin/env node
/**
 * Codemod: add explicit file extensions to relative import/export specifiers.
 *
 * Node runs build-less source as ES modules, where relative specifiers need an
 * explicit extension (`./foo` -> `./foo.ts`). This rewrites extensionless relative
 * specifiers to point at the real target file, and fixes the TypeScript
 * `./foo.js`-means-`foo.ts` convention (native Node does not remap `.js` -> `.ts`).
 *
 * Handles `.ts`/`.tsx`/`.js`/`.jsx` source. Idempotent and re-runnable: specifiers
 * that already resolve to a real file are left alone, so a long-lived branch can
 * merge `main` and re-run this to fix only the newly introduced imports.
 *
 * Usage: node scripts/codemod-import-extensions.mjs [packageDir ...]
 * With no args, processes the default Node-run package set (src/ and app/).
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Project, QuoteKind, SyntaxKind } from 'ts-morph';

const DEFAULT_PACKAGES = [
  'packages/constants',
  'packages/errors',
  'packages/utils',
  'packages/settings',
  'packages/database',
  'packages/shared',
  'packages/api-client',
  'packages/central-server',
  'packages/facility-server',
  'packages/fake-data',
  'packages/upgrade',
  'packages/scripts',
];

const TS_EXT = /\.(ts|tsx)$/;
const ASSET_EXT = /\.(json|css|scss|svg|png|jpg|jpeg|gif|wasm)$/;
const JS_EXT = /\.(js|jsx|mjs|cjs)$/;
// Candidate target extensions, in resolution priority (TS-first repo).
const CANDIDATES = ['.ts', '.tsx', '.js', '.jsx'];

const packages = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PACKAGES;

/** Rewrite a relative specifier to point at its real target file, or null to leave it. */
function resolveSpecifier(fromFile, spec) {
  if (!spec.startsWith('.')) return null; // bare/package imports
  if (ASSET_EXT.test(spec)) return null; // non-code assets

  const dir = dirname(fromFile);
  // A real file already sitting at the literal specifier (incl. correct .ts/.js) — done.
  if ((TS_EXT.test(spec) || JS_EXT.test(spec)) && existsSync(resolve(dir, spec))) return null;
  // Strip a JS-style extension (the `./foo.js`-means-source convention) to find the source.
  const jsMatch = spec.match(JS_EXT);
  const bare = jsMatch ? spec.slice(0, -jsMatch[0].length) : spec.replace(TS_EXT, '');
  const base = resolve(dir, bare);

  for (const ext of CANDIDATES) if (existsSync(`${base}${ext}`)) return `${bare}${ext}`;
  const sep = bare.endsWith('/') ? '' : '/';
  for (const ext of CANDIDATES) if (existsSync(`${base}/index${ext}`)) return `${bare}${sep}index${ext}`;
  return null; // unresolved: warn, don't guess
}

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  manipulationSettings: { quoteKind: QuoteKind.Single },
  compilerOptions: { allowJs: true, jsx: 2 /* preserve */ },
});

for (const pkg of packages) {
  for (const sub of ['src', 'app']) {
    project.addSourceFilesAtPaths(`${pkg}/${sub}/**/*.{ts,tsx,js,jsx}`);
  }
}

let changed = 0;
let unresolved = 0;
const touchedFiles = new Set();

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath();
  let fileTouched = false;

  const rewrite = node => {
    const spec = node.getLiteralValue();
    const next = resolveSpecifier(filePath, spec);
    if (next === null) {
      if (spec.startsWith('.') && !TS_EXT.test(spec) && !ASSET_EXT.test(spec) && !JS_EXT.test(spec)) {
        console.warn(`  ! could not resolve ${JSON.stringify(spec)} in ${filePath}`);
        unresolved += 1;
      }
      return;
    }
    if (next === spec) return;
    node.setLiteralValue(next);
    changed += 1;
    fileTouched = true;
  };

  for (const decl of [...sourceFile.getImportDeclarations(), ...sourceFile.getExportDeclarations()]) {
    const literal = decl.getModuleSpecifier();
    if (literal) rewrite(literal);
  }
  for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const expr = call.getExpression();
    const isImport = expr.getKind() === SyntaxKind.ImportKeyword;
    const isRequire = expr.getKind() === SyntaxKind.Identifier && expr.getText() === 'require';
    if (!isImport && !isRequire) continue;
    const [arg] = call.getArguments();
    if (arg && arg.getKind() === SyntaxKind.StringLiteral) rewrite(arg);
  }

  if (fileTouched) touchedFiles.add(filePath);
}

project.saveSync();
console.log(`\nRewrote ${changed} specifier(s) across ${touchedFiles.size} file(s).`);
if (unresolved) console.log(`${unresolved} relative specifier(s) could not be resolved — review the warnings above.`);
