import { calculatePageLimit } from './calculatePageLimit';
import { SYNC_SESSION_DIRECTION } from '../constants';
import { PullParams } from '../MobileSyncManager';
import { type SyncRecord } from '../types';

type PulledPage = { records: SyncRecord[]; pullTime: number };

export const pullRecordsInBatches = async (
  { centralServer, sessionId, recordTotal, progressCallback = () => {} }: PullParams,
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

  let fromId: string | undefined;
  let limit = calculatePageLimit();
  let totalPulled = 0;
  let current = await fetchPage(limit, fromId);

  while (totalPulled < recordTotal && current.records.length > 0) {
    // Get next cursor and adjust page size based on how long the last pull took
    const last = current.records.at(-1);
    const nextFromId = last
      ? btoa(JSON.stringify({ sortOrder: last.sortOrder, id: last.id }))
      : undefined;
    limit = calculatePageLimit(limit, current.pullTime);

    // Prefetch next page in background
    const nextPromise = nextFromId
      ? fetchPage(limit, nextFromId)
      : Promise.resolve({ records: [], pullTime: 0 });

    // Process current page while next is downloading
    const recordsToSave = current.records.map(r => {
      // mark as never updated, so we don't push it back to the central server until
      r.data.updated_at_sync_tick = -1;
      r.direction = SYNC_SESSION_DIRECTION.INCOMING;
      return r;
    });
    await processRecords(recordsToSave);
    totalPulled += current.records.length;
    progressCallback(recordsToSave.length);

    // Switch to next page
    fromId = nextFromId;
    current = await nextPromise;
  }
};
