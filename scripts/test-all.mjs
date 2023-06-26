import { execFileSync } from 'child_process';
import { doWithAllPackages } from './_do-with-all-packages.mjs';

doWithAllPackages((name, pkg) => {
  if (!pkg?.scripts?.test) {
    console.log(`Skipping ${name} as it doesn't have a test script...`);
    return;
  }

  console.log(`Testing ${name}...`);
  execFileSync('yarn', ['workspace', pkg.name, 'run', 'test', ...process.argv.slice(2)], {
    stdio: 'inherit',
  });
});
