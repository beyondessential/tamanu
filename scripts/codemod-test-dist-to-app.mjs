#!/usr/bin/env node
/**
 * Server integration tests import the application under test from the built
 * output (`../dist/...`). Build-less, they must import the source instead
 * (`../app/...`). The swc build is a 1:1 `app/` -> `dist/` file map, so rewrite
 * any relative import/require/export specifier whose path segment is `dist` to
 * `app`.
 *
 * Usage: node scripts/codemod-test-dist-to-app.mjs <testDir ...>
 */
import { Project, QuoteKind, SyntaxKind } from 'ts-morph';

const dirs = process.argv.slice(2);
if (!dirs.length) {
  console.error('Usage: node scripts/codemod-test-dist-to-app.mjs <testDir ...>');
  process.exit(1);
}

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  manipulationSettings: { quoteKind: QuoteKind.Single },
  compilerOptions: { allowJs: true, jsx: 2 },
});
for (const dir of dirs) project.addSourceFilesAtPaths(`${dir}/**/*.{ts,tsx,js,jsx}`);

// `(../)+dist/rest` or `(../)+dist` -> swap the `dist` segment for `app`
const rewrite = spec =>
  /^(\.\.?\/)+dist(\/|$)/.test(spec) ? spec.replace(/(^(?:\.\.?\/)+)dist(\/|$)/, '$1app$2') : spec;

let changed = 0;
const touched = new Set();

for (const sf of project.getSourceFiles()) {
  // static import/export ... from '...'
  for (const decl of [...sf.getImportDeclarations(), ...sf.getExportDeclarations()]) {
    const spec = decl.getModuleSpecifierValue?.();
    if (!spec) continue;
    const next = rewrite(spec);
    if (next !== spec) {
      decl.setModuleSpecifier(next);
      changed += 1;
      touched.add(sf.getFilePath());
    }
  }
  // require('...'), dynamic import('...'), and the jest mock family whose first
  // argument is a module path (jest.mock/doMock/requireActual/requireMock/unmock).
  const MODULE_PATH_CALLS = new Set([
    'require',
    'import',
    'jest.mock',
    'jest.doMock',
    'jest.unmock',
    'jest.requireActual',
    'jest.requireMock',
    'jest.setMock',
  ]);
  for (const call of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const expr = call.getExpression().getText();
    if (!MODULE_PATH_CALLS.has(expr)) continue;
    const [arg] = call.getArguments();
    if (!arg || arg.getKind() !== SyntaxKind.StringLiteral) continue;
    const spec = arg.getLiteralText();
    const next = rewrite(spec);
    if (next !== spec) {
      arg.setLiteralValue(next);
      changed += 1;
      touched.add(sf.getFilePath());
    }
  }
}

project.saveSync();
console.log(`Rewrote ${changed} dist->app specifier(s) across ${touched.size} file(s).`);
