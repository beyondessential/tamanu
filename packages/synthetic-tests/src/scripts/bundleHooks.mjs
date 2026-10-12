#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NODE_MODULES = path.join(__dirname, '../../../../node_modules');

const ENTRY = path.join(__dirname, '../hooks/index.ts');
const OUTFILE = path.join(__dirname, '../hooks.bundle.cjs');
const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.js'];

const findFile = base =>
  EXTENSIONS.map(ext => base + ext).find(file =>
    fs.statSync(file, { throwIfNoEntry: false })?.isFile(),
  );

const mapExport = (exportsField, subpath) => {
  if (typeof exportsField === 'string') return subpath === '.' ? exportsField : null;
  if (exportsField[subpath]) return exportsField[subpath];
  for (const [pattern, target] of Object.entries(exportsField)) {
    if (!pattern.endsWith('/*') || !subpath.startsWith(pattern.slice(0, -1))) continue;
    return target.replace('*', subpath.slice(pattern.length - 1));
  }
  return null;
};

// Workspace packages export extensionless source paths, which esbuild's own resolver rejects.
const workspacePackages = {
  name: 'workspace-packages',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@tamanu\// }, ({ path: specifier }) => {
      const [scope, name, ...rest] = specifier.split('/');
      const packageDir = fs.realpathSync(path.join(NODE_MODULES, scope, name));
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'),
      );
      const { exports: exportsField, main } = packageJson;
      const subpath = rest.length ? `./${rest.join('/')}` : '.';
      const target =
        (exportsField && mapExport(exportsField, subpath)) ?? (subpath === '.' ? main : subpath);
      const file = target && findFile(path.join(packageDir, target));
      if (!file) return { errors: [{ text: `Could not resolve ${specifier}` }] };
      return { path: file };
    });
  },
};

await build({
  entryPoints: [ENTRY],
  outfile: OUTFILE,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['sequelize', 'pg', 'pg-hstore', 'pg-native'],
  plugins: [workspacePackages],
  logLevel: 'warning',
});
