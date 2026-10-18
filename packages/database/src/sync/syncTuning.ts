import config from 'config';

const numberFromEnv = (name: string, configValue: number): number => {
  const raw = process.env[name];
  if (!raw) return configValue;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a number, got "${raw}"`);
  }
  return value;
};

export const getSyncTuning = () => ({
  persistedCacheBatchSize: numberFromEnv(
    'SYNC_PERSISTED_CACHE_BATCH_SIZE',
    config.sync.persistedCacheBatchSize,
  ),
  pauseBetweenPersistedCacheBatchesInMilliseconds: numberFromEnv(
    'SYNC_PAUSE_BETWEEN_PERSISTED_CACHE_BATCHES_MS',
    config.sync.pauseBetweenPersistedCacheBatchesInMilliseconds,
  ),
  pauseBetweenCacheBatchInMilliseconds: numberFromEnv(
    'SYNC_PAUSE_BETWEEN_CACHE_BATCHES_MS',
    config.sync.pauseBetweenCacheBatchInMilliseconds,
  ),
  persistUpdateWorkerPoolSize: numberFromEnv(
    'SYNC_PERSIST_UPDATE_WORKER_POOL_SIZE',
    config.sync.persistUpdateWorkerPoolSize,
  ),
  adjustDataBatchSize: numberFromEnv(
    'SYNC_ADJUST_DATA_BATCH_SIZE',
    config.sync.adjustDataBatchSize,
  ),
  incomingSyncHookBatchSize: numberFromEnv(
    'SYNC_INCOMING_SYNC_HOOK_BATCH_SIZE',
    config.sync.incomingSyncHookBatchSize,
  ),
});
