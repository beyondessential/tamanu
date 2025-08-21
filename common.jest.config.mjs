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

export function config(importMeta, overrides = {}, { transformNodeModules = false } = {}) {
  let swcjson = {};
  const swcpath = join(dirname(fileURLToPath(importMeta.url)), '.swcrc');
  if (canRead(swcpath)) {
    swcjson = JSON.parse(readFileSync(swcpath, 'utf8'));
  }

  return {
    setupFiles: ['<rootDir>/__tests__/setup.js'],
    testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
    collectCoverageFrom: ['src/**/*.[jt]sx?'],

    maxWorkers: isCI ? '50%' : '25%',

    // workaround for memory leaks
    workerIdleMemoryLimit: '512MB',

    showSeed: true, // helps to reproduce order-dependence bugs

    transform: {
      '^.+\\.jsx?$': ['@swc/jest', {
        ...swcjson,
        module: {
          ...swcjson.module,
          type: 'commonjs',
        },
        ...(transformNodeModules ? {
          exclude: [],
        } : {})
      }],
    },
    ...(transformNodeModules ? {
      transformIgnorePatterns: [
        `node_modules/(?!(${transformNodeModules.join('|')})/)`,
      ],
    } : {}),

    ...overrides,
  };
}
