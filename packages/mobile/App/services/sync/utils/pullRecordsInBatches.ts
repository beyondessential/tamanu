import { calculatePageLimit, calculatePageLimitWithMemoryGuard } from './calculatePageLimit';
import { SYNC_SESSION_DIRECTION } from '../constants';
import { PullParams } from '../MobileSyncManager';

export const pullRecordsInBatches = async (
  { centralServer, sessionId, recordTotal, progressCallback = () => {} }: PullParams,
  processRecords: (records: any) => Promise<void>,
) => {
  let fromId: string | undefined;
  let limit = calculatePageLimit();
  let totalPulled = 0;

  type PulledPage = { records: any[]; pullTime: number };
  const fetchPage = async (pageLimit: number, pageFromId?: string): Promise<PulledPage> => {
    const startTime = Date.now();
    const records = await centralServer.pull(sessionId, pageLimit, pageFromId);
    const pullTime = Date.now() - startTime;
    return { records, pullTime };
  };

  let current = await fetchPage(limit, fromId);

  while (totalPulled < recordTotal && current.records.length > 0) {
    // compute next cursor and adjust page size based on how long the last pull took
    const last = current.records.at(-1);
    const nextFromId = last ? btoa(JSON.stringify({ sortOrder: last.sortOrder, id: last.id })) : undefined;
    limit = await calculatePageLimitWithMemoryGuard(limit, current.pullTime);

    // prefetch next page in background
    const nextPromise = nextFromId ? fetchPage(limit, nextFromId) : Promise.resolve({ records: [], pullTime: 0 });

    // process current page while next is downloading
    const recordsToSave = current.records.map(r => {
      r.data.updated_at_sync_tick = -1;
      r.direction = SYNC_SESSION_DIRECTION.INCOMING;
      return r;
    });
    await processRecords(recordsToSave);
    totalPulled += current.records.length;
    progressCallback(recordsToSave.length);

    // switch to next page
    fromId = nextFromId;
    current = await nextPromise;
  }
};
