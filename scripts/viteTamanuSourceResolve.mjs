import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The @tamanu/* packages expose extensionless `source` exports (e.g.
// `./utils/translation` -> `./src/utils/translation`). The tsx loader and the Vite dev
// server resolve those to a real file or `/index.*`, but the production Rollup build
// does not, so it fails on directory/extensionless targets. This Vite plugin completes
// that resolution the same way tsx does: it lets Vite try first, then falls back to
// resolving the package's `exports` to a concrete file. Used by every bundled frontend
// (web, patient-portal) that consumes @tamanu/* source.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

const completeSourcePath = id => {
  if (existsSync(id) && statSync(id).isFile()) return id;
  for (const ext of SOURCE_EXTS) if (existsSync(id + ext)) return id + ext;
  if (existsSync(id) && statSync(id).isDirectory()) {
    for (const ext of SOURCE_EXTS) {
      const indexFile = join(id, `index${ext}`);
      if (existsSync(indexFile)) return indexFile;
    }
  }
  return null;
};

// Map a subpath (e.g. `./utils/translation`) to its `exports` target, honouring exact
// keys first then a single `*` wildcard.
const matchExportTarget = (exports, subpath) => {
  if (!exports || typeof exports !== 'object') return null;
  if (typeof exports[subpath] === 'string') return exports[subpath];
  for (const [key, value] of Object.entries(exports)) {
    if (typeof value !== 'string' || !key.includes('*')) continue;
    const [prefix, suffix] = key.split('*');
    if (subpath.startsWith(prefix) && subpath.endsWith(suffix)) {
      const star = subpath.slice(prefix.length, subpath.length - suffix.length);
      return value.replace('*', star);
    }
  }
  return null;
};

const manualTamanuResolve = source => {
  const match = source.match(/^(@tamanu\/[^/]+)(?:\/(.*))?$/);
  if (!match) return null;
  const [, packageName, subpathRest] = match;
  const subpath = subpathRest ? `./${subpathRest}` : '.';
  let packageRoot;
  let packageJson;
  try {
    const packageJsonPath = join(repoRoot, 'node_modules', packageName, 'package.json');
    packageRoot = dirname(realpathSync(packageJsonPath));
    packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  } catch {
    return null;
  }
  const target = matchExportTarget(packageJson.exports, subpath);
  return target ? completeSourcePath(join(packageRoot, target)) : null;
};

export const tamanuSourceResolve = {
  name: 'tamanu-source-resolve',
  async resolveId(source, importer, options) {
    if (!source.startsWith('@tamanu/')) return null;
    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
    if (resolved) return resolved;
    return manualTamanuResolve(source);
  },
};
