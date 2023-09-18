import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';

function cleanupLeadingGarbage(jsonStr) {
  if (jsonStr.startsWith('{')) return jsonStr;

  // strangest thing ever, in some environments the yarn output starts with a bunch of garbage
  // that looks like this: `\x1b[2K\x1b[G` before the first {, so we need to strip it out
  const firstOpenBrace = jsonStr.indexOf('{');
  if (firstOpenBrace === -1) return jsonStr;
  return jsonStr.slice(firstOpenBrace);
}

export function doWithAllPackages(fn) {
  const workspaceTree = JSON.parse(
    cleanupLeadingGarbage(execFileSync('yarn', ['-s', 'workspaces', 'info'], { encoding: 'utf8' })),
  );
  const workspaces = new Set(Object.keys(workspaceTree));
  const processed = new Set();

  const packagesThatAreDependedOn = new Set(
    Object.values(workspaceTree).flatMap(({ workspaceDependencies }) => workspaceDependencies),
  );

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
