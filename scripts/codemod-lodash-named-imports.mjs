#!/usr/bin/env node
/**
 * Codemod: rewrite lodash named imports to per-method default imports.
 *
 *   import { isNil, inRange } from 'lodash';
 *   ->
 *   import isNil from 'lodash/isNil.js';
 *   import inRange from 'lodash/inRange.js';
 *
 * lodash is CommonJS and does not expose statically-detectable named exports, so
 * `import { x } from 'lodash'` fails under native ESM (the swc->CJS build hid this).
 * Per-method default imports resolve cleanly. Aliases are preserved
 * (`{ foo as bar }` -> `import bar from 'lodash/foo.js'`). Namespace and default
 * imports of lodash are left alone. Idempotent.
 *
 * Usage: node scripts/codemod-lodash-named-imports.mjs [packageDir ...]
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Project, QuoteKind } from 'ts-morph';

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

const packages = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PACKAGES;
const lodashRoot = resolve('node_modules/lodash');

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  manipulationSettings: { quoteKind: QuoteKind.Single },
  compilerOptions: { allowJs: true, jsx: 2 },
});
for (const pkg of packages) {
  for (const sub of ['src', 'app']) {
    project.addSourceFilesAtPaths(`${pkg}/${sub}/**/*.{ts,tsx,js,jsx}`);
  }
}

let changed = 0;
let skipped = 0;
const touched = new Set();

for (const sourceFile of project.getSourceFiles()) {
  for (const imp of sourceFile.getImportDeclarations()) {
    if (imp.getModuleSpecifierValue() !== 'lodash') continue;
    if (imp.getNamespaceImport()) continue; // `import * as _ from 'lodash'` is fine

    const named = imp.getNamedImports().filter(n => !n.isTypeOnly());
    if (named.length === 0) continue;

    const specs = named.map(n => ({ name: n.getName(), local: n.getAliasNode()?.getText() ?? n.getName() }));
    // Only rewrite when every name maps to a real lodash per-method module.
    const allResolve = specs.every(s => existsSync(resolve(lodashRoot, `${s.name}.js`)));
    if (!allResolve) {
      console.warn(`  ! ${sourceFile.getFilePath()}: some lodash names have no per-method module, left as-is`);
      skipped += 1;
      continue;
    }

    const index = imp.getChildIndex();
    const hasDefault = Boolean(imp.getDefaultImport());
    if (hasDefault) {
      named.forEach(n => n.remove()); // keep `import _ from 'lodash'`
    } else {
      imp.remove();
    }
    sourceFile.insertImportDeclarations(
      index,
      specs.map(s => ({ defaultImport: s.local, moduleSpecifier: `lodash/${s.name}.js` })),
    );
    changed += specs.length;
    touched.add(sourceFile.getFilePath());
  }
}

project.saveSync();
console.log(`\nRewrote ${changed} lodash import(s) across ${touched.size} file(s).`);
if (skipped) console.log(`${skipped} import statement(s) skipped — review the warnings above.`);
