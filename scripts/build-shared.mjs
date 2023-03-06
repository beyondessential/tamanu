import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';

const topPkg = JSON.parse(readFileSync('./package.json'));

for (const name of topPkg.workspaces.packages) {
  console.log(`Checking ${name}...`);
  const pkg = JSON.parse(readFileSync(`./${name}/package.json`));
  if (!pkg.name.startsWith('@tamanu/')) continue;

  console.log(`Building ${pkg.name}...`);
  execFileSync('yarn', ['workspace', pkg.name, 'run', 'build'], { stdio: 'inherit' });
}

console.log('Building shared-src...');
execFileSync('yarn', ['workspace', 'shared-src', 'run', 'build'], { stdio: 'inherit' });

console.log('Running yarn...');
execFileSync('yarn', ['install', '--frozen-lockfile'], { stdio: 'inherit' });
