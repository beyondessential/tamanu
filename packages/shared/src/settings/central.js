export const centralDefaults = {
  sync: {
    readOnly: false,
    persistedCacheBatchSize: 20000,
    adjustDataBatchSize: 20000,
    syncAllEncountersForTheseVaccines: [],
    numberConcurrentPullSnapshots: 4,
    // at its very large default, maxRecordsPerPullSnapshotChunk is essentially "off"
    // can be turned on by lowering to some amount that seems appropriate if snapshot performance is an issue
    maxRecordsPerPullSnapshotChunk: 1000000000,
  },
};
