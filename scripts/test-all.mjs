import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';

const topPkg = JSON.parse(readFileSync('./package.json'));

for (const name of topPkg.workspaces.packages) {
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(`./${name}/package.json`));
  } catch (err) {
    console.log(`Skipping ${name} as we can't read its package.json...`);
    continue;
  }

  if (!pkg?.scripts?.test) {
    console.log(`Skipping ${name} as it doesn't have a test script...`);
    continue;
  }

  console.log(`Testing ${name}...`);
  execFileSync('yarn', ['workspace', pkg.name, 'run', 'test', ...process.argv.slice(2)], { stdio: 'inherit' });
}
