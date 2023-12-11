#!/usr/bin/env node

import { promises as fs } from 'fs';
import { glob } from 'glob';

const src = process.argv[2];
const dst = process.argv.slice(3).map((d, i) => [process.argv.slice(3).length - i, d.replace(/\/?$/, '/')]);

const files = await glob(`${src}/**/*.d.ts`, { ignore: 'node_modules/**' });
if (files.length === 0) {
    process.exit(0);
}

for (const file of files) {
    for (const [i, d] of dst) {
        const dest = file.replace(new RegExp(`^${src}/`), d);
        console.error(`put ${file} in ${dest}`);
        if (i === 1) {
            await fs.rename(file, dest);
        } else {
            await fs.copyFile(file, dest);
        }
    }
}
