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

export interface FacilitySyncTuning {
  persistedCacheBatchSize?: number;
  pauseBetweenPersistedCacheBatchesInMilliseconds?: number;
  pauseBetweenCacheBatchInMilliseconds?: number;
  persistUpdateWorkerPoolSize?: number;
}

let fromCentral: FacilitySyncTuning = {};

export const setSyncTuningFromCentral = (tuning: FacilitySyncTuning | undefined) => {
  fromCentral = tuning ?? {};
};

export const getSyncTuning = () => ({
  persistedCacheBatchSize: sizeFromEnv(
    'SYNC_PERSISTED_CACHE_BATCH_SIZE',
    fromCentral.persistedCacheBatchSize ?? config.sync.persistedCacheBatchSize,
  ),
  pauseBetweenPersistedCacheBatchesInMilliseconds: pauseFromEnv(
    'SYNC_PAUSE_BETWEEN_PERSISTED_CACHE_BATCHES_MS',
    fromCentral.pauseBetweenPersistedCacheBatchesInMilliseconds ??
      config.sync.pauseBetweenPersistedCacheBatchesInMilliseconds,
  ),
  pauseBetweenCacheBatchInMilliseconds: pauseFromEnv(
    'SYNC_PAUSE_BETWEEN_CACHE_BATCHES_MS',
    fromCentral.pauseBetweenCacheBatchInMilliseconds ??
      config.sync.pauseBetweenCacheBatchInMilliseconds,
  ),
  persistUpdateWorkerPoolSize: sizeFromEnv(
    'SYNC_PERSIST_UPDATE_WORKER_POOL_SIZE',
    fromCentral.persistUpdateWorkerPoolSize ?? config.sync.persistUpdateWorkerPoolSize,
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
