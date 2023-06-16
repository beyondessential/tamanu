import { execFileSync } from 'child_process';
import { doWithAllPackages } from './_do-with-all-packages.mjs';

doWithAllPackages((name, pkg) => {
  if (!pkg?.scripts?.lint) {
    console.log(`Skipping ${name} as it doesn't have a lint script...`);
    return;
  }

  console.log(`Linting ${name}...`);

  // Some packages require special handling for lint --fix
  if (process.argv.includes('--fix') && pkg?.scripts?.['lint:fix']) {
    execFileSync(
      'yarn',
      [
        'workspace',
        pkg.name,
        'run',
        'lint:fix',
        ...process.argv.slice(2).filter(arg => arg !== '--fix'),
      ],
      {
        stdio: 'inherit',
      },
    );
    return;
  }

  execFileSync('yarn', ['workspace', pkg.name, 'run', 'lint', ...process.argv.slice(2)], {
    stdio: 'inherit',
  });
});
