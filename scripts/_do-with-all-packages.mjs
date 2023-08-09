import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';

export function doWithAllPackages(fn) {
  const workspaceTree = JSON.parse(
    execFileSync('yarn', ['-s', 'workspaces', 'info'], { encoding: 'utf8' }),
  );
  const workspaces = new Set(Object.keys(workspaceTree));
  const processed = new Set();

  const packagesThatAreDependedOn = new Set(Object.values(workspaceTree).flatMap(({ workspaceDependencies }) => workspaceDependencies));

  while (processed.size < workspaces.size) {
    for (const workspace of workspaces) {
      if (processed.has(workspace)) continue;
      const { location, workspaceDependencies } = workspaceTree[workspace];
      if (workspaceDependencies.every(dep => processed.has(dep))) {
        processed.add(workspace);

        const pkgPath = `./${location}/package.json`;
        let pkg;
        try {
          pkg = JSON.parse(readFileSync(pkgPath));
        } catch (err) {
          console.log(`Skipping ${workspace} as we can't read its package.json...`);
          continue;
        }

        fn(workspace, pkg, pkgPath, packagesThatAreDependedOn.has(workspace));
      }
    }
  }
}
