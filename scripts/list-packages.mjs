#!/usr/bin/env node

import { doWithAllPackages } from './_do-with-all-packages.mjs';

export function listPackages(options) {
  const packages = [];

  doWithAllPackages((name, _pkg, pkgPath, isShared) => {
    console.error(`Checking ${name}...`);
    if (options.sharedOnly && !isShared) {
      console.error(`Skipping ${name} as it's not a shared package...`);
      return;
    }

    if (options.noShared && isShared) {
      console.error(`Skipping ${name} as it is a shared package...`);
      return;
    }

    if (options.paths) {
      packages.push(pkgPath.replace(/^[.]\//, '').replace(/[/]package[.]json$/, ''));
    } else {
      packages.push(name);
    }
  });

  return packages;
}

// This file was originally a cli script but converted to double down as a module.
if (import.meta.filename === process.argv[1]) {
  // module was not imported but called directly
  const packages = listPackages({
    sharedOnly: process.argv.includes('--shared-only'),
    noShared: process.argv.includes('--no-shared'),
    paths: process.argv.includes('--paths')
  });
  console.log(JSON.stringify(packages));
}
