#!/usr/bin/env node
/**
 * Rewrite named imports from CommonJS packages that lack statically-detectable named
 * exports (so they fail under native ESM / tsx) into a default import + destructure:
 *
 *   import { get as g, set } from 'lodash';
 *   ->
 *   import __cjs_lodash from 'lodash';
 *   const { get: g, set } = __cjs_lodash;
 *
 * Pass the offending package names as args after `--pkgs`. Type-only and namespace/
 * default imports are left alone. Idempotent.
 *
 * Usage: node scripts/codemod-cjs-named-imports.mjs --pkgs lodash date-fns-tz config -- <packageDir ...>
 */
import { Project, QuoteKind } from 'ts-morph';

const argv = process.argv.slice(2);
const sep = argv.indexOf('--');
const pkgsFlag = argv.indexOf('--pkgs');
const cjsPkgs = new Set(argv.slice(pkgsFlag + 1, sep === -1 ? undefined : sep));
const dirs = sep === -1 ? [] : argv.slice(sep + 1);
if (!cjsPkgs.size || !dirs.length) {
  console.error('Usage: node scripts/codemod-cjs-named-imports.mjs --pkgs <pkg...> -- <packageDir...>');
  process.exit(1);
}

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  manipulationSettings: { quoteKind: QuoteKind.Single },
  compilerOptions: { allowJs: true, jsx: 2 },
});
for (const dir of dirs) for (const sub of ['src', 'app']) project.addSourceFilesAtPaths(`${dir}/${sub}/**/*.{ts,tsx,js,jsx}`);

let changed = 0;
const touched = new Set();
const localName = pkg => `__cjs_${pkg.replace(/[^a-zA-Z0-9]/g, '_')}`;

for (const sf of project.getSourceFiles()) {
  // Collect every named import of a CJS package in this file first, grouped by package, so a
  // file that imports the same package across multiple declarations emits a single default
  // import + destructure rather than duplicate `__cjs_pkg` declarations (which won't parse).
  const groups = new Map(); // pkg -> { bindings: string[], decls: ImportDeclaration[] }
  for (const imp of sf.getImportDeclarations()) {
    const pkg = imp.getModuleSpecifierValue();
    if (!cjsPkgs.has(pkg)) continue;
    if (imp.getNamespaceImport() || imp.getDefaultImport()) continue; // leave default/namespace forms
    const named = imp.getNamedImports().filter(n => !n.isTypeOnly());
    if (!named.length) continue;
    const bindings = named.map(n => {
      const a = n.getAliasNode()?.getText();
      return a ? `${n.getName()}: ${a}` : n.getName();
    });
    const group = groups.get(pkg) ?? { bindings: [], decls: [] };
    group.bindings.push(...bindings);
    group.decls.push(imp);
    groups.set(pkg, group);
  }
  for (const [pkg, { bindings, decls }] of groups) {
    const local = localName(pkg);
    const index = decls[0].getChildIndex();
    for (const decl of decls) decl.remove();
    sf.insertImportDeclaration(index, { defaultImport: local, moduleSpecifier: pkg });
    // Dedupe identical bindings so repeated imports of the same name don't produce a
    // duplicate destructure key.
    sf.insertStatements(index + 1, `const { ${[...new Set(bindings)].join(', ')} } = ${local};`);
    changed += decls.length;
    touched.add(sf.getFilePath());
  }
}

project.saveSync();
console.log(`Rewrote ${changed} CJS named import(s) across ${touched.size} file(s) for: ${[...cjsPkgs].join(', ')}`);
