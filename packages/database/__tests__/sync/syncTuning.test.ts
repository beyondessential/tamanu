import { afterEach, describe, expect, it } from 'vitest';
import config from 'config';

import { getSyncTuning } from '../../src/sync/syncTuning';

describe('getSyncTuning', () => {
  afterEach(() => {
    delete process.env.SYNC_PERSIST_UPDATE_WORKER_POOL_SIZE;
    delete process.env.SYNC_PAUSE_BETWEEN_CACHE_BATCHES_MS;
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

  it('refuses a malformed value', () => {
    process.env.SYNC_PERSIST_UPDATE_WORKER_POOL_SIZE = '8M';
    expect(() => getSyncTuning()).toThrow('SYNC_PERSIST_UPDATE_WORKER_POOL_SIZE');
  });
});
