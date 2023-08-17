import { execFileSync } from 'child_process';
import { doWithAllPackages } from './_do-with-all-packages.mjs';

doWithAllPackages((name, pkg, _pkgPath, isShared) => {
  console.log(`Checking ${name}...`);
  if (process.argv.includes('--shared-only') && !isShared) {
    console.log(`Skipping ${name} as it's not a shared package...`);
    return;
  }

  if (!pkg.scripts?.build) {
    console.log(`Skipping ${name} as it doesn't have a build script...`);
    return;
  }

  console.log(`Building ${name}...`);
  execFileSync('yarn', ['workspace', pkg.name, 'run', 'build'], { stdio: 'inherit' });
});
