#!/usr/bin/env node

import { promises as fs } from 'fs';
import { glob } from 'glob';
import _ from 'lodash';
import { ensureDirectoryExists } from './dirs.mjs';

/** Escape $ in replacement string so it is not interpreted as $&, $1, etc. */
function escapeReplacement(s) {
  return String(s).replace(/\$/g, '$$');
}

const src = process.argv[2];
const dst = process.argv.slice(3).map((d, i) => [
  // enumerate backwards so that 1 is always the last dst,
  // so we can switch from copy to rename below
  process.argv.slice(3).length - i,

  // normalise dst paths to always end with a /
  d.replace(/\/?$/, '/'),
]);

const files = await glob(`${src}/**/*.d.ts{,.map}`, { ignore: 'node_modules/**' });
if (files.length === 0) {
  process.exit(0);
}

const srcPattern = new RegExp(`^${_.escapeRegExp(src)}/`);
for (const file of files) {
  for (const [i, d] of dst) {
    const dest = file.replace(srcPattern, escapeReplacement(d));
    ensureDirectoryExists(dest);
    console.error(`put ${file} in ${dest}`);
    if (i === 1) {
      await fs.rename(file, dest);
    } else {
      await fs.copyFile(file, dest);
    }
  }
}
