import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export const isCI = !!process.env.CI;

export function config(importMeta, overrides = {}) {
  const swcpath = join(dirname(fileURLToPath(importMeta.url)), '.swcrc');
  const swcjson = JSON.parse(readFileSync(swcpath, 'utf8'));

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
