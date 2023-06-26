import { execFileSync } from 'child_process';
import { doWithAllPackages } from './_do-with-all-packages.mjs';

doWithAllPackages((name, pkg) => {
  console.log(`Checking ${name}...`);
  if (!pkg.name.startsWith('@tamanu/')) return;

  if (!pkg.scripts?.build) {
    console.log(`Skipping ${name} as it doesn't have a build script...`);
    return;
  }

  console.log(`Building ${name}...`);
  execFileSync('yarn', ['workspace', pkg.name, 'run', 'build'], { stdio: 'inherit' });
});

console.log('Building shared-src...');
execFileSync('yarn', ['workspace', 'shared-src', 'run', 'build'], { stdio: 'inherit' });

console.log('Running yarn...');
execFileSync('yarn', ['install', '--frozen-lockfile'], { stdio: 'inherit' });
