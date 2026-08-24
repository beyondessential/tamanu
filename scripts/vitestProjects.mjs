import { globSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

// Which packages run vitest, as directory names under `packages/`. Keyed on the presence of a
// vitest config file, so a package cannot start running vitest without joining the root
// config's project list. web is named by hand because its vitest options live in the
// `vite.config.js` it shares with its build.
//
// This deliberately isn't derived from plan-ci.mjs's SPECIAL_PACKAGES, which answers a
// different question ("has bespoke CI handling"): central-server, facility-server and
// database are special in CI but must be vitest projects, while `scripts` (tape) is the
// reverse. Deriving either list from the other inverts the answer for all four.
export const vitestPackageDirectories = [
  ...globSync('packages/*/vitest.config.ts', { cwd: repoRoot }).map(
    path => path.split(/[\\/]/)[1],
  ),
  'web',
].sort();

// The same list as vitest `projects` entries. Each is a directory rather than a glob: vitest
// treats a globbed directory with no config as a project with default options, which would
// sweep in the packages that deliberately use another runner.
export const vitestProjects = vitestPackageDirectories.map(directory => `packages/${directory}`);
