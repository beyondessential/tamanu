#!/usr/bin/env node

import { glob } from 'glob';
import _ from 'lodash';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseArgs, styleText } from 'node:util';
import { ensureDirectoryExists } from './dirs.mjs';

/** @param {string} pathLike */
function stylePath(pathLike) {
  const dir = styleText(['dim'], `${path.dirname(pathLike)}/`);
  const base = styleText(['green'], path.basename(pathLike));
  return `${dir}${base}`;
}

/**
 * Escape `$` in replacement string so it is not interpreted as `$&`, `$1`, etc.
 * @param {string} s
 */
function escapeReplacement(s) {
  return s.replaceAll('$', '$$');
}

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    copy: {
      type: 'boolean',
      default: false,
    },
  },
  allowPositionals: true,
});

const copyOnly = values.copy;
const src = positionals[0];
const dst = positionals.slice(1).map((d, i) => [
  // enumerate backwards so that 1 is always the last dst,
  // so we can switch from copy to rename below
  positionals.slice(1).length - i,

  // normalise dst paths to always end with a /
  d.replace(/\/?$/, '/'),
]);

if (!src || dst.length === 0) {
  console.error('Usage: move-dts [--copy] <srcDir> <dstDir> [...dstDir]');
  process.exit(1);
}

const files = await glob(`${src}/**/*.d.ts{,.map}`, { ignore: 'node_modules/**' });
if (files.length === 0) {
  process.exit(0);
}

const srcPattern = new RegExp(`^${_.escapeRegExp(src)}/`);
for (const file of files) {
  for (const [i, d] of dst) {
    const dest = file.replace(srcPattern, escapeReplacement(d));
    ensureDirectoryExists(dest);
    if (copyOnly || i !== 1) {
      await fs.copyFile(file, dest);
    } else {
      await fs.rename(file, dest);
    }
    console.log(`Wrote ${stylePath(dest)}`);
  }
}
