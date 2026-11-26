import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const pm2ConfigPath = require.resolve('../pm2.config.cjs');
const originalConfigDir = process.env.NODE_CONFIG_DIR;

const loadAppNames = fhirWorkerEnabled => {
  if (fhirWorkerEnabled === undefined) delete process.env.TAMANU_FHIR_WORKER_ENABLED;
  else process.env.TAMANU_FHIR_WORKER_ENABLED = fhirWorkerEnabled;
  delete require.cache[pm2ConfigPath];
  return require(pm2ConfigPath).apps.map(app => app.name);
};

describe('pm2 FHIR worker flag', () => {
  afterEach(() => {
    delete process.env.TAMANU_FHIR_WORKER_ENABLED;
    process.env.NODE_CONFIG_DIR = originalConfigDir;
  });

  it('follows config when the env var is unset', () => {
    expect(loadAppNames(undefined)).toContain('tamanu-fhir-refresh');
  });

  it('lets the env var turn the worker off over config', () => {
    const names = loadAppNames('false');
    expect(names).not.toContain('tamanu-fhir-refresh');
    expect(names).not.toContain('tamanu-fhir-resolve');
  });

  it('runs both workers when the env var is true', () => {
    expect(loadAppNames('true')).toEqual(
      expect.arrayContaining(['tamanu-fhir-refresh', 'tamanu-fhir-resolve']),
    );
  });

  it('refuses a value other than true or false', () => {
    expect(() => loadAppNames('yes')).toThrow('TAMANU_FHIR_WORKER_ENABLED');
  });
});
