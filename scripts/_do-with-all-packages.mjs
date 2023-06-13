import { readFileSync } from 'fs';

export function doWithAllPackages(fn) {
  const topPkg = JSON.parse(readFileSync('./package.json'));

  for (const name of topPkg.workspaces.packages) {
    const pkgPath = `./${name}/package.json`;
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(pkgPath));
    } catch (err) {
      console.log(`Skipping ${name} as we can't read its package.json...`);
      continue;
    }

    fn(name, pkg, pkgPath);
  }
}
