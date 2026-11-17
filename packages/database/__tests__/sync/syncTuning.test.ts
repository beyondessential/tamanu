import { afterEach, describe, expect, it } from 'vitest';
import config from 'config';
import { centralSettings } from '@tamanu/settings';

import { getSyncTuning, setSyncTuningFromCentral } from '../../src/sync/syncTuning';

describe('getSyncTuning', () => {
  afterEach(() => {
    delete process.env.SYNC_PERSIST_UPDATE_WORKER_POOL_SIZE;
    delete process.env.SYNC_PAUSE_BETWEEN_CACHE_BATCHES_MS;
    setSyncTuningFromCentral(undefined);
  });

  it('refuses a zero size but accepts a zero pause', () => {
    process.env.SYNC_PAUSE_BETWEEN_CACHE_BATCHES_MS = '0';
    expect(getSyncTuning().pauseBetweenCacheBatchInMilliseconds).toBe(0);
    process.env.SYNC_PERSIST_UPDATE_WORKER_POOL_SIZE = '0';
    expect(() => getSyncTuning()).toThrow('SYNC_PERSIST_UPDATE_WORKER_POOL_SIZE');
  });

  it('falls back to config when the env var is unset', () => {
    expect(getSyncTuning().persistUpdateWorkerPoolSize).toBe(
      config.sync.persistUpdateWorkerPoolSize,
    );
  });

  it('prefers the env var over config', () => {
    process.env.SYNC_PERSIST_UPDATE_WORKER_POOL_SIZE = '3';
    expect(getSyncTuning().persistUpdateWorkerPoolSize).toBe(3);
  });

  it("prefers central's value over config", () => {
    setSyncTuningFromCentral({ persistUpdateWorkerPoolSize: 2 });
    expect(getSyncTuning().persistUpdateWorkerPoolSize).toBe(2);
  });

  it('reads every key of the central facilitySync setting', () => {
    const keys = Object.keys(centralSettings.properties.facilitySync.properties);
    const fromCentral = Object.fromEntries(keys.map((key, index) => [key, 100 + index]));
    setSyncTuningFromCentral(fromCentral);
    expect(getSyncTuning()).toMatchObject(fromCentral);
  });

  it("prefers the env var over central's value", () => {
    setSyncTuningFromCentral({ persistUpdateWorkerPoolSize: 2 });
    process.env.SYNC_PERSIST_UPDATE_WORKER_POOL_SIZE = '3';
    expect(getSyncTuning().persistUpdateWorkerPoolSize).toBe(3);
  });

  it('refuses a malformed value', () => {
    process.env.SYNC_PERSIST_UPDATE_WORKER_POOL_SIZE = '8M';
    expect(() => getSyncTuning()).toThrow('SYNC_PERSIST_UPDATE_WORKER_POOL_SIZE');
  });
});
