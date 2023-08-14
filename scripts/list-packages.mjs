#!/usr/bin/env node

import { doWithAllPackages } from './_do-with-all-packages.mjs';

const packages = [];
doWithAllPackages((name, _pkg, pkgPath, isShared) => {
  console.error(`Checking ${name}...`);
  if (process.argv.includes('--shared-only') && !isShared) {
    console.error(`Skipping ${name} as it's not a shared package...`);
    return;
  }

  if (process.argv.includes('--no-shared') && isShared) {
    console.error(`Skipping ${name} as it is a shared package...`);
    return;
  }

  if (process.argv.includes('--paths')) {
    packages.push(pkgPath.replace(/^[.]\//, '').replace(/[/]package[.]json$/, ''));
  } else {
    packages.push(name);
  }
});

console.log(JSON.stringify(packages));
