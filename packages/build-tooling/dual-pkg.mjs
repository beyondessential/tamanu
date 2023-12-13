#!/usr/bin/env node

import { promises as fs } from 'fs';

const mjs = process.argv[2];
const cjs = process.argv[3];

if (mjs) await fs.writeFile(`${mjs}/package.json`, '{"type":"module"}');
if (cjs) await fs.writeFile(`${cjs}/package.json`, '{"type":"commonjs"}');
