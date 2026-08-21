import { execFileSync } from 'child_process';
import { doWithAllPackages } from './_do-with-all-packages.mjs';
import { vitestPackageDirectories } from './vitestProjects.mjs';

// The vitest packages are covered by the root `vitest run`, which the root `test` script runs
// first. This walks what's left: the packages on another runner (mobile on jest, e2e-tests on
// Playwright, scripts on tape).
const vitestPackages = new Set(vitestPackageDirectories);

doWithAllPackages((name, pkg, pkgPath) => {
  if (!pkg?.scripts?.test) {
    console.log(`Skipping ${name} as it doesn't have a test script...`);
    return;
  }

  const directory = pkgPath.replace(/^\.\/packages\//, '').replace(/\/package\.json$/, '');
  if (vitestPackages.has(directory)) {
    console.log(`Skipping ${name} as the root vitest run covers it...`);
    return;
  }

  console.log(`Testing ${name}...`);
  execFileSync('npm', ['--workspace', pkg.name, 'run', 'test', ...process.argv.slice(2)], {
    stdio: 'inherit',
  });
});
