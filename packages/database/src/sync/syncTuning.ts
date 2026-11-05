import config from 'config';

const integerFromEnv = (name: string, configValue: number, minimum: number): number => {
  const raw = process.env[name];
  if (!raw) return configValue;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${name} must be an integer of at least ${minimum}, got "${raw}"`);
  }
  return value;
};

const sizeFromEnv = (name: string, configValue: number) => integerFromEnv(name, configValue, 1);
const pauseFromEnv = (name: string, configValue: number) => integerFromEnv(name, configValue, 0);

export const getSyncTuning = () => ({
  persistedCacheBatchSize: sizeFromEnv(
    'SYNC_PERSISTED_CACHE_BATCH_SIZE',
    config.sync.persistedCacheBatchSize,
  ),
  pauseBetweenPersistedCacheBatchesInMilliseconds: pauseFromEnv(
    'SYNC_PAUSE_BETWEEN_PERSISTED_CACHE_BATCHES_MS',
    config.sync.pauseBetweenPersistedCacheBatchesInMilliseconds,
  ),
  pauseBetweenCacheBatchInMilliseconds: pauseFromEnv(
    'SYNC_PAUSE_BETWEEN_CACHE_BATCHES_MS',
    config.sync.pauseBetweenCacheBatchInMilliseconds,
  ),
  persistUpdateWorkerPoolSize: sizeFromEnv(
    'SYNC_PERSIST_UPDATE_WORKER_POOL_SIZE',
    config.sync.persistUpdateWorkerPoolSize,
  ),
  adjustDataBatchSize: sizeFromEnv(
    'SYNC_ADJUST_DATA_BATCH_SIZE',
    config.sync.adjustDataBatchSize,
  ),
  incomingSyncHookBatchSize: sizeFromEnv(
    'SYNC_INCOMING_SYNC_HOOK_BATCH_SIZE',
    config.sync.incomingSyncHookBatchSize,
  ),
});
