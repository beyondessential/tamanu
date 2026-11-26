import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// spec: MUPD#release-packaging

/** What goes into the Android package besides the workspace packages it is built from. */
const MOBILE_BUILD_INPUTS = [
  'package.json',
  'package-lock.json',
  'patches',
  '.github/workflows/cd-package-android.yml',
];

/**
 * Everything that goes into the Android package: the mobile workspace, every workspace package it
 * depends on (directly or through another, dev dependencies included, since they shape the
 * build), and the build inputs shared with the rest of the repo.
 */
export function mobilePackagePaths(cwd = process.cwd()) {
  const readManifest = path => JSON.parse(readFileSync(join(cwd, path, 'package.json'), 'utf8'));
  const workspacePathByName = new Map(
    readManifest('.').workspaces.packages.map(path => [readManifest(path).name, path]),
  );

  const included = new Set();
  const pending = ['@tamanu/mobile'];
  while (pending.length > 0) {
    const name = pending.pop();
    if (included.has(name)) continue;
    included.add(name);
    const { dependencies, devDependencies, peerDependencies } = readManifest(
      workspacePathByName.get(name),
    );
    const dependencyNames = Object.keys({
      ...dependencies,
      ...devDependencies,
      ...peerDependencies,
    });
    pending.push(...dependencyNames.filter(dependency => workspacePathByName.has(dependency)));
  }

  return [
    ...[...included].map(name => workspacePathByName.get(name)).sort(),
    ...MOBILE_BUILD_INPUTS,
  ];
}

function parseVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Not a release version: ${version}`);
  const [, major, minor, patch] = match.map(Number);
  return { major, minor, patch };
}

export function gitHistory(cwd = process.cwd()) {
  // The lockfile alone is well over the default 1 MB output buffer
  const git = (...args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

  return {
    /** Release tags on the same minor line that are ancestors of `ref`, newest first. None if they can't be listed. */
    releaseTagsBefore(ref, major, minor) {
      try {
        return git(
          'tag',
          '--merged',
          ref,
          '--list',
          `v${major}.${minor}.*`,
          '--sort=-version:refname',
        )
          .split('\n')
          .filter(tag => /^v\d+\.\d+\.\d+$/.test(tag));
      } catch {
        return [];
      }
    },
    /**
     * Whether any of `paths` differ between the two refs, other than the release version bump every
     * release makes to each package.json and the lockfile. A comparison that cannot be made counts
     * as a change.
     */
    hasChanged(fromRef, toRef, paths) {
      try {
        const versionAt = ref => JSON.parse(git('show', `${ref}:package.json`)).version;
        const fromVersionField = `"version": "${versionAt(fromRef)}"`;
        const toVersionField = `"version": "${versionAt(toRef)}"`;
        const changedFiles = git('diff', '--name-only', fromRef, toRef, '--', ...paths)
          .split('\n')
          .filter(Boolean);
        return changedFiles.some(file => {
          const before = git('show', `${fromRef}:${file}`).replaceAll(
            fromVersionField,
            toVersionField,
          );
          return before !== git('show', `${toRef}:${file}`);
        });
      } catch {
        return true;
      }
    },
  };
}

/**
 * The latest release, up to and including `version` at `ref`, in its minor line that changed the
 * mobile app. That release published the Android package devices on this line must run.
 */
export function findMobileRelease({
  version,
  ref = 'HEAD',
  history = gitHistory(),
  paths = mobilePackagePaths(),
}) {
  const { major, minor, patch } = parseVersion(version);
  if (patch === 0) return `${major}.${minor}.${patch}`;

  const previousTag = history
    .releaseTagsBefore(ref, major, minor)
    .find(tag => parseVersion(tag).patch < patch);
  if (!previousTag || history.hasChanged(previousTag, ref, paths)) {
    return `${major}.${minor}.${patch}`;
  }

  return findMobileRelease({ version: previousTag, ref: previousTag, history, paths });
}
