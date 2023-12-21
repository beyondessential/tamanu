import { readFileSync, accessSync, constants } from 'fs';
import { join, dirname } from 'path';
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

export function config(importMeta, overrides = {}) {
  let swcjson = {};
  const swcpath = join(dirname(fileURLToPath(importMeta.url)), '.swcrc');
  if (canRead(swcpath)) {
    swcjson = JSON.parse(readFileSync(swcpath, 'utf8'));
  }

  return {
    setupFiles: ['<rootDir>/__tests__/setup.js'],
    testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
    collectCoverageFrom: ['src/**/*.[jt]sx?'],

    maxWorkers: isCI ? '100%' : '50%',

    // workaround for memory leaks
    workerIdleMemoryLimit: '512MB',

    showSeed: true, // helps to reproduce order-dependence bugs

    transform: {
      '^.+\\.js$': ['@swc/jest', {
        ...swcjson,
        module: {
          ...swcjson.module,
          type: 'commonjs',
        },
      }],
    },

    ...overrides,
  };
}
