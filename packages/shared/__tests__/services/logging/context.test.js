import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('config', () => ({
  default: {
    canonicalHostName: null,
    sync: { host: 'https://config-central.example' },
    serverFacilityIds: ['facility-config'],
  },
}));

import { serviceContext } from '../../../src/services/logging/context';

const ENV_KEYS = ['CANONICAL_HOST_NAME', 'SYNC_URL', 'TAMANU_FACILITY_IDS'];

describe('serviceContext', () => {
  const original = {};

  beforeEach(() => {
    ENV_KEYS.forEach(key => {
      original[key] = process.env[key];
      delete process.env[key];
    });
  });
  afterEach(() => {
    ENV_KEYS.forEach(key => {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    });
  });

  it('names the deployment from CANONICAL_HOST_NAME', () => {
    process.env.CANONICAL_HOST_NAME = 'https://central.kamaka.example';
    expect(serviceContext()['deployment.name']).toBe('central-kamaka-example');
  });

  it('names the deployment from the SYNC_URL host, leaving out its credentials', () => {
    process.env.SYNC_URL = 'https://sync-user:s3cret@central.drifting.example';
    const context = serviceContext();
    expect(context['deployment.name']).toBe('central-drifting-example');
    expect(JSON.stringify(context)).not.toContain('s3cret');
  });

  it('falls back to the config sync host without either env var', () => {
    expect(serviceContext()['deployment.name']).toBe('config-central-example');
  });

  it('takes the facility from TAMANU_FACILITY_IDS before config', () => {
    process.env.TAMANU_FACILITY_IDS = 'facility-env';
    expect(serviceContext()['deployment.facility']).toBe('env');
  });

  it('takes the facility from config without TAMANU_FACILITY_IDS', () => {
    expect(serviceContext()['deployment.facility']).toBe('config');
  });
});
