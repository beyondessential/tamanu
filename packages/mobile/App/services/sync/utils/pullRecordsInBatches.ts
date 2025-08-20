import { calculatePageLimit } from './calculatePageLimit';
import { SYNC_SESSION_DIRECTION } from '../constants';
import { PullParams } from '../MobileSyncManager';
import { type SyncRecord } from '../types';

type PulledPage = { records: SyncRecord[]; pullTime: number };

export const pullRecordsInBatches = async (
  { centralServer, syncSettings, sessionId, recordTotal, progressCallback = () => {} }: PullParams,
  processRecords: (records: SyncRecord[]) => Promise<void>,
) => {
  if (recordTotal === 0) {
    return;
  }

  const fetchPage = async (pageLimit: number, pageFromId?: string): Promise<PulledPage> => {
    const startTime = Date.now();
    const records = await centralServer.pull(sessionId, pageLimit, pageFromId);
    const pullTime = Date.now() - startTime;
    return { records, pullTime };
  };

  const { dynamicLimiter: dynamicLimiterSettings } = syncSettings || {};
  let limit = calculatePageLimit(dynamicLimiterSettings);
  let totalPulled = 0;
  let current = await fetchPage(limit);

  while (totalPulled < recordTotal && current.records.length > 0) {
    // Get next cursor and adjust page size based on how long the last pull took
    const last = current.records.at(-1);
    const nextFromId = btoa(JSON.stringify({ sortOrder: last.sortOrder, id: last.id }))
    
    limit = calculatePageLimit(dynamicLimiterSettings, limit, current.pullTime);

    // Prefetch next page in background
    const nextPromise = fetchPage(limit, nextFromId)

    // Process current page while next is downloading
    const recordsToSave = current.records.map(r => ({
      ...r,
      // mark as never updated, so we don't push it back to the central server until the next update
      data: { ...r.data, updated_at_sync_tick: -1 },
      direction: SYNC_SESSION_DIRECTION.INCOMING,
    }));
    await processRecords(recordsToSave);
    totalPulled += current.records.length;
    progressCallback(recordsToSave.length);

    // Switch to next page
    current = await nextPromise;
  }
};
