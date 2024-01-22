import { execFileSync } from 'child_process';
import { doWithAllPackages } from './_do-with-all-packages.mjs';

const args = process.argv.slice(2);
const target = args.filter((arg) => !arg.startsWith('--'))[0];
if (target) {
  console.log(`Building shared+target: ${target}`);
}

doWithAllPackages((name, pkg, _pkgPath, isShared) => {
  console.log(`Checking ${name}...`);
  if (args.includes('--shared-only') && !isShared) {
    console.log(`Skipping ${name} as it's not a shared package...`);
    return;
  }

  if (!pkg.scripts?.build) {
    console.log(`Skipping ${name} as it doesn't have a build script...`);
    return;
  }

  if (target && !isShared && name != target) {
    console.log(`Skipping ${name} as it's not the target...`);
    return;
  }

  console.log(`Building ${name}...`);
  execFileSync('yarn', ['workspace', pkg.name, 'run', 'build'], { stdio: 'inherit' });
});
