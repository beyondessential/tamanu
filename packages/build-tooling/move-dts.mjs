#!/usr/bin/env node

import { promises as fs } from 'fs';
import { glob } from 'glob';

const src = process.argv[2];
const dir = process.argv[3];

const files = await glob(`${src}/**/*.d.ts`, { ignore: 'node_modules/**' });
for (const file of files) {
    const dest = file.replace(new RegExp(`^${src}/`), `${dir}/`);
    console.error(`mv ${file} to ${dest}`);
    await fs.rename(file, dest);
}
