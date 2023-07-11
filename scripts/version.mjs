#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'fs/promises';
import path from 'path';

let version = process.argv[2]?.toLowerCase();
if (!version) {
  console.log('Usage: node scripts/version.mjs <version>');
  process.exit(1);
}

const topLevelPkg = JSON.parse(await fs.readFile('package.json', 'utf8'));

if (['major', 'minor', 'patch'].includes(version)) {
  const { version: origVersion } = topLevelPkg;
  const [major, minor, patch] = origVersion.split('.');
  switch (version) {
    case 'major':
      version = `${parseInt(major) + 1}.0.0`;
      break;
    case 'minor':
      version = `${major}.${parseInt(minor) + 1}.0`;
      break;
    case 'patch':
      version = `${major}.${minor}.${parseInt(patch) + 1}`;
      break;
    default:
      throw new Error('unreachable');
  }
}

async function bumpPackageJson(packagePath, newVersion) {
  const fullPath = path.join(packagePath, 'package.json');
  console.log('Bumping', fullPath, 'to', newVersion);
  const file = JSON.parse(await fs.readFile(fullPath, 'utf8'));
  file.version = newVersion;
  await fs.writeFile(fullPath, `${JSON.stringify(file, null, 2)}\n`);
}

console.log('Bumping package.jsons to', version);
for (const pkg of topLevelPkg.workspaces.packages) {
  if (pkg === 'packages/shared') continue;
  await bumpPackageJson(pkg, version);
}
await bumpPackageJson('.', version);
await bumpPackageJson('packages/desktop/app', version);
await bumpPackageJson('packages/mobile', version);
