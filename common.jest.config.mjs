import { accessSync, constants, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const isCI = !!process.env.CI;

function canRead(path) {
  try {
    accessSync(path, constants.R_OK);
    return true;
  } catch(_) {
    return false;
  }
}

// ESM-only dependencies that ship no CommonJS entry, so jest (which runs CJS)
// must transform them rather than ignore them with the rest of node_modules.
const ALWAYS_TRANSFORM = ['lodash-es', 'es-toolkit', '@tamanu'];

export function config(importMeta, overrides = {}, { transformNodeModules = [] } = {}) {
  let swcjson = {};
  const swcpath = join(dirname(fileURLToPath(importMeta.url)), '.swcrc');
  if (canRead(swcpath)) {
    swcjson = JSON.parse(readFileSync(swcpath, 'utf8'));
  }
  // `exclude` (a .swcrc-level "skip these files" option) must not leak into the
  // inline transform — it would cause swc to pass node_modules sources through
  // untransformed even though jest selected them for transformation.
  const swcBase = { ...swcjson };
  delete swcBase.exclude;

  // Run everything through swc as CommonJS, choosing the parser by extension so a
  // package's own .swcrc parser (e.g. central's `ecmascript`) doesn't reject the
  // TypeScript source it imports from internal @tamanu packages.
  const swcWith = parser => [
    '@swc/jest',
    {
      ...swcBase,
      jsc: { ...swcBase.jsc, parser },
      module: { ...swcBase.module, type: 'commonjs' },
    },
  ];

  const whitelist = [...new Set([...ALWAYS_TRANSFORM, ...transformNodeModules])];

  return {
    setupFiles: ['<rootDir>/__tests__/setup.js'],
    testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
    collectCoverageFrom: ['src/**/*.[jt]sx?'],

    maxWorkers: isCI ? '50%' : '25%',

    // workaround for memory leaks
    workerIdleMemoryLimit: '512MB',

    showSeed: true, // helps to reproduce order-dependence bugs

    ...overrides,

    transform: {
      '^.+\\.tsx?$': swcWith({ syntax: 'typescript', tsx: true }),
      '^.+\\.(js|jsx|mjs|cjs)$': swcWith({ syntax: 'ecmascript', jsx: true }),
      ...overrides.transform,
    },
    transformIgnorePatterns: [`node_modules/(?!(${whitelist.join('|')})/)`],

    // Source across the workspace uses the `.js` import extension convention even
    // for `.ts` files (e.g. `export * from './ai.js'`); strip it so jest resolves
    // against moduleFileExtensions (which prefers real `.js`, falling back to `.ts`).
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
      ...overrides.moduleNameMapper,
    },
  };
}
