import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';

function cleanupLeadingGarbage(jsonStr) {
  if (jsonStr.startsWith('{')) return jsonStr;

  // some environments come with garbage characters at the beginning
  const firstOpenBrace = jsonStr.indexOf('{');
  if (firstOpenBrace === -1) return jsonStr;
  return jsonStr.slice(firstOpenBrace);
}

function extractDependencyTree(workspaceTree, workspaces) {
  const dependencyTree = {};

  Object.entries(workspaceTree.dependencies).forEach(([workspace, info]) => {
    if (info.dependencies) {
      dependencyTree[workspace] = Object.keys(info.dependencies).filter(dependency =>
        workspaces.has(dependency),
      );
    }
  });

  return dependencyTree;
}

function extractLocation(resolvedPath) {
  const packageIndex = resolvedPath.indexOf('packages');
  return resolvedPath.slice(packageIndex);
}

export function doWithAllPackages(fn) {
  const workspaceTree = JSON.parse(
    cleanupLeadingGarbage(
      execFileSync('npm', ['ls', '--workspaces', '--json'], { encoding: 'utf8' }),
    ),
  );

  const workspaces = new Set(Object.keys(workspaceTree.dependencies));
  const processed = new Set();

  const dependencyTree = extractDependencyTree(workspaceTree, workspaces);
  const packagesThatAreDependedOn = new Set(Object.values(dependencyTree).flat());

  while (processed.size < workspaces.size) {
    for (const workspace of workspaces) {
      if (processed.has(workspace)) continue;

      const { resolved } = workspaceTree.dependencies[workspace];
      const location = extractLocation(resolved);
      const workspaceDependencies = dependencyTree[workspace];

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
