#!/usr/bin/env node

import { promises as fs } from 'fs';
import { ensureDirectoryExists } from './dirs.mjs';

const mjs = process.argv[2];
const cjs = process.argv[3];

if (mjs) {
  const mjsFilename = `${mjs}/package.json`;
  ensureDirectoryExists(mjsFilename);
  await fs.writeFile(mjsFilename, '{"type":"module"}');
}

if (cjs) {
  const cjsFilename = `${cjs}/package.json`;
  ensureDirectoryExists(cjsFilename);
  await fs.writeFile(cjsFilename, '{"type":"commonjs"}');
}