import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { doWithAllPackages } from './_do-with-all-packages.mjs';

const { values, positionals } = parseArgs({
  options: {
    'shared-only': { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

const target = positionals[0];
if (target) {
  console.log(`Building shared+target: ${target}`);
}

doWithAllPackages((name, pkg, _pkgPath, isShared) => {
  console.log(`Checking ${name}...`);
  if (values['shared-only'] && !isShared) {
    console.log(`Skipping ${name} as it’s not a shared package`);
    return;
  }

  if (!pkg.scripts?.build) {
    console.log(`Skipping ${name} as it doesn’t have a build script`);
    return;
  }

  if (target && !isShared && name != target) {
    console.log(`Skipping ${name} as it’s not the target`);
    return;
  }

  console.log(`Building ${name}...`);
  execFileSync('npm', ['--workspace', pkg.name, 'run', 'build'], { stdio: 'inherit' });
});
