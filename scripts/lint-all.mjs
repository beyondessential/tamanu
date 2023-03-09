import { execFileSync } from 'child_process';
import { doWithAllPackages } from './_do-with-all-packages.mjs';

doWithAllPackages((name, pkg) => {
  if (!pkg?.scripts?.lint) {
    console.log(`Skipping ${name} as it doesn't have a lint script...`);
    return;
  }

  console.log(`Linting ${name}...`);
  execFileSync('yarn', ['workspace', pkg.name, 'run', 'lint', ...process.argv.slice(2)], {
    stdio: 'inherit',
  });
});
