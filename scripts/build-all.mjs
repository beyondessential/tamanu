import { readFileSync } from 'fs';
import { spawn, spawnSync } from 'child_process';
import os from 'os';

const args = process.argv.slice(2);
const sharedOnly = args.includes('--shared-only');
const target = args.filter(arg => !arg.startsWith('--'))[0];
if (target) {
  console.log(`Building shared+target: ${target}`);
}

// Cap on how many package builds run at once. The dependency graph is only a
// few packages wide, so this mostly guards against oversubscribing small CI
// machines while still letting independent packages build in parallel.
const CONCURRENCY =
  Number(process.env.BUILD_CONCURRENCY) || Math.max(2, Math.min(6, (os.cpus()?.length ?? 4) - 1));

function cleanupLeadingGarbage(jsonStr) {
  const firstOpenBrace = jsonStr.indexOf('{');
  return firstOpenBrace <= 0 ? jsonStr : jsonStr.slice(firstOpenBrace);
}

function extractLocation(resolvedPath) {
  const packageIndex = resolvedPath.indexOf('packages');
  return resolvedPath.slice(packageIndex);
}

// `npm ls` exits non-zero on extraneous/peer-dep noise even though it still
// prints a valid tree, so read stdout regardless of exit code rather than
// throwing and aborting the whole build.
function getWorkspaceTree() {
  const { stdout } = spawnSync('npm', ['ls', '--workspaces', '--legacy-peer-deps', '--json'], {
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
  });
  return JSON.parse(cleanupLeadingGarbage(stdout ?? ''));
}

const workspaceTree = getWorkspaceTree();
const workspaces = new Set(Object.keys(workspaceTree.dependencies));

// workspace name -> list of in-repo dependency names
const dependencyTree = {};
for (const [name, info] of Object.entries(workspaceTree.dependencies)) {
  dependencyTree[name] = Object.keys(info.dependencies ?? {}).filter(dep => workspaces.has(dep));
}
const packagesThatAreDependedOn = new Set(Object.values(dependencyTree).flat());

// Decide which packages we actually build, applying the same filters as the
// original sequential script.
const packageNameByWorkspace = {};
const toBuild = new Set();
for (const name of workspaces) {
  const location = extractLocation(workspaceTree.dependencies[name].resolved);
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(`./${location}/package.json`));
  } catch {
    console.error(`Skipping ${name} as we can't read its package.json...`);
    continue;
  }
  packageNameByWorkspace[name] = pkg.name;
  const isShared = packagesThatAreDependedOn.has(name);

  if (!pkg.scripts?.build) continue;
  if (sharedOnly && !isShared) continue;
  if (target && !isShared && name !== target) continue;
  toBuild.add(name);
}

// Simple concurrency gate so we don't spawn every build at once.
let running = 0;
const queue = [];
function acquire() {
  if (running < CONCURRENCY) {
    running += 1;
    return Promise.resolve();
  }
  return new Promise(resolve => {
    queue.push(resolve);
  }).then(() => {
    running += 1;
  });
}
function release() {
  running -= 1;
  queue.shift()?.();
}

function runBuild(name) {
  return acquire().then(
    () =>
      new Promise((resolve, reject) => {
        console.log(`Building ${name}...`);
        const child = spawn('npm', ['--workspace', packageNameByWorkspace[name], 'run', 'build'], {
          stdio: 'inherit',
        });
        child.on('exit', code => {
          release();
          if (code === 0) {
            console.log(`Built ${name}.`);
            resolve();
          } else {
            reject(new Error(`${name} build failed with exit code ${code}`));
          }
        });
        child.on('error', err => {
          release();
          reject(err);
        });
      }),
  );
}

// Build each package as soon as all of its in-repo dependencies have finished,
// so independent packages build concurrently instead of strictly in series.
const builds = new Map();
function build(name) {
  if (builds.has(name)) return builds.get(name);
  const deps = (dependencyTree[name] ?? []).filter(dep => toBuild.has(dep));
  const promise = Promise.all(deps.map(build)).then(() => runBuild(name));
  builds.set(name, promise);
  return promise;
}

try {
  await Promise.all([...toBuild].map(build));
  console.log('All builds complete.');
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
