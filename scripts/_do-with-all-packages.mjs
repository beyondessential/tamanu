import { readFileSync, globSync } from 'fs';

// Invoke `fn` for each workspace package in dependency order (a package is only
// visited once all the workspace packages it depends on have been visited).
//
// The workspace list and dependency graph are read straight from the
// package.json files rather than from `npm ls`. `npm ls` exits non-zero whenever
// the tree has any "ELSPROBLEMS" — e.g. react being pinned via `overrides` to a
// version that doesn't satisfy @material-ui v4's (stale) peer range, or the
// `node` dependency's node-bin-setup looking extraneous — none of which affect
// the build-order graph but would crash this script.

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// name -> { pkg, pkgPath }, for every workspace package with a readable package.json
function locateWorkspaces() {
  const root = readJson('./package.json');
  const patterns = root.workspaces?.packages ?? root.workspaces ?? [];

  const byName = new Map();
  for (const pattern of patterns) {
    for (const dir of globSync(pattern)) {
      const pkgPath = `./${dir}/package.json`;
      let pkg;
      try {
        pkg = readJson(pkgPath);
      } catch {
        continue; // not an actual package directory
      }
      if (pkg.name) byName.set(pkg.name, { pkg, pkgPath });
    }
  }
  return byName;
}

export function doWithAllPackages(fn) {
  const byName = locateWorkspaces();
  const workspaces = new Set(byName.keys());

  // Inter-workspace dependency graph from declared *production* dependencies only.
  // devDependencies are excluded because they introduce false build-order cycles
  // between packages that only depend on each other for tests (e.g. shared ↔ fake-data).
  const dependencyTree = {};
  for (const [name, { pkg }] of byName) {
    dependencyTree[name] = Object.keys(pkg.dependencies ?? {}).filter(dependency =>
      workspaces.has(dependency),
    );
  }
  const packagesThatAreDependedOn = new Set(Object.values(dependencyTree).flat());

  // visit each workspace once all of its workspace dependencies have been visited;
  // bounded by workspaces.size passes (a clean DAG settles in far fewer).
  const processed = new Set();
  for (let i = 0; i <= workspaces.size; i++) {
    if (processed.size === workspaces.size) break;
    for (const name of workspaces) {
      if (processed.has(name)) continue;
      if (!dependencyTree[name].every(dependency => processed.has(dependency))) continue;

      processed.add(name);
      const { pkg, pkgPath } = byName.get(name);
      fn(name, pkg, pkgPath, packagesThatAreDependedOn.has(name));
    }
  }
}
