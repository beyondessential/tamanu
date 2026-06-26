export const isCI = !!process.env.CI;

// ESM-only dependencies that ship no CommonJS entry, so jest (which runs CJS)
// must transform them rather than ignore them with the rest of node_modules.
const ALWAYS_TRANSFORM = ['lodash-es', 'es-toolkit', '@tamanu'];

// `importMeta` is accepted for call-site compatibility (callers pass `import.meta`)
// but is no longer needed: the swc transform config below is self-contained, so
// there are no per-package `.swcrc` files left to locate.
export function config(importMeta, overrides = {}, { transformNodeModules = [] } = {}) {
  // swc options for transforming TS/JS test sources to CommonJS for jest. This mirrors
  // what the tsx/esbuild runtime does at boot (strip types, ESM->CJS, no syntax
  // downlevelling on modern Node). The parser is chosen per file extension so TypeScript
  // imported from internal @tamanu packages is handled even from a JS entry point.
  // `swcrc: false` keeps this the single source of truth — swc must not read any on-disk
  // `.swcrc` (whose `exclude`/`dts` options would make it refuse to process source).
  const swcWith = parser => [
    '@swc/jest',
    {
      swcrc: false,
      jsc: { parser, target: 'esnext', keepClassNames: true },
      module: { type: 'commonjs' },
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
    transformIgnorePatterns: [
      `node_modules/(?!(${whitelist.join('|')})/)`,
      ...(overrides.transformIgnorePatterns ?? []),
    ],

    // Source across the workspace uses the `.js` import extension convention even
    // for `.ts` files (e.g. `export * from './ai.js'`); strip it so jest resolves
    // against moduleFileExtensions (which prefers real `.js`, falling back to `.ts`).
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
      ...overrides.moduleNameMapper,
    },
  };
}
