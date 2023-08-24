import { execFileSync } from 'child_process';
import { doWithAllPackages } from './_do-with-all-packages.mjs';

let errored = false;
doWithAllPackages((name, pkg) => {
  if (!pkg?.scripts?.lint) {
    console.log(`Skipping ${name} as it doesn't have a lint script...`);
    return;
  }

  console.log(`Linting ${name}...`);

  const args = ['workspace', pkg.name, 'run'];
  if (process.argv.includes('--fix') && pkg?.scripts?.['lint:fix']) {
    // Some packages require special handling for lint --fix
    args.push('lint:fix');
    args.push(...process.argv.slice(2).filter(arg => arg !== '--fix'));
  } else {
    args.push('lint');
    args.push(...process.argv.slice(2));
  }

  try {
    execFileSync('yarn', args, {
      stdio: 'inherit',
    });
  } catch (err) {
    if (process.env.CONTINUE_ON_ERROR) {
      console.error(`Linting ${name} failed!`);
      console.error(err);
      errored = true;
    } else {
      throw err;
    }
  }
});

if (errored) {
  process.exit(1);
}
