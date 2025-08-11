import { calculatePageLimit } from './calculatePageLimit';
import { SYNC_SESSION_DIRECTION } from '../constants';
import { PullParams } from '../MobileSyncManager';

export const pullRecordsInBatches = async (
  {
    centralServer,
    sessionId,
    recordTotal,
    progressCallback = () => {},
    syncSettings,
  }: PullParams,
  processRecords: (records: any) => Promise<void>,
) => {
  const { dynamicLimiter: dynamicLimiterSettings } = syncSettings || {};
  let fromId;
  let limit = calculatePageLimit(dynamicLimiterSettings);
  let totalPulled = 0;

  // pull changes a page at a time
  while (totalPulled < recordTotal) {
    const startTime = Date.now();
    const records = await centralServer.pull(sessionId, limit, fromId);
    const pullTime = Date.now() - startTime;
    const recordsToSave = records.map(r => ({
      ...r,
      // mark as never updated, so we don't push it back to the central server until the next update
      data: { ...r.data, updated_at_sync_tick: -1 },
      direction: SYNC_SESSION_DIRECTION.INCOMING,
    }));

    await processRecords(recordsToSave);

    const { id, sortOrder } = records[records.length - 1];
    fromId = btoa(JSON.stringify({ sortOrder, id }));
    totalPulled += records.length;
    limit = calculatePageLimit(dynamicLimiterSettings, limit, pullTime);

    progressCallback(recordsToSave.length);
  }
};
