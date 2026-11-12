#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGES = path.join(__dirname, '../../..');

// Workspace exports point at extensionless source paths, which esbuild only probes for plain paths.
const alias = Object.fromEntries(
  fs
    .readdirSync(PACKAGES)
    .map(name => [`@tamanu/${name}`, path.join(PACKAGES, name, 'src')])
    .filter(([, src]) => fs.existsSync(src)),
);

await build({
  entryPoints: [path.join(__dirname, '../hooks/index.ts')],
  outfile: path.join(__dirname, '../hooks.bundle.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['sequelize', 'pg', 'pg-hstore', 'pg-native'],
  alias,
  logLevel: 'warning',
});
