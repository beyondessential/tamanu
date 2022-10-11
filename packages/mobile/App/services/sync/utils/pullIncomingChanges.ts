import { saveFileInDocuments } from '/helpers/file';
import { CentralServerConnection } from '../CentralServerConnection';
import { calculatePageLimit } from './calculatePageLimit';
import { SYNC_SESSION_DIRECTION } from '../constants';

const APPROX_PERSISTED_BATCH_SIZE = 20000;

const persistBatch = async (batchIndex: number, rows: [Record<string, any>?]): Promise<void> => {
  const fileName = `batch${batchIndex}.json`;

  await saveFileInDocuments(
    Buffer.from(JSON.stringify(rows), 'utf-8').toString('base64'),
    fileName,
  );
};

/**
 * Pull incoming changes in batches and save them in session_sync_record table,
 * which will be used to persist to actual tables later
 * @param centralServer
 * @param sessionId
 * @param since
 * @param progressCallback
 * @returns
 */
export const pullIncomingChanges = async (
  centralServer: CentralServerConnection,
  sessionId: string,
  since: number,
  progressCallback: (total: number, progressCount: number) => void,
): Promise<number> => {
  centralServer.setPullFilter(sessionId, since);
  const totalToPull = await centralServer.fetchPullCount(sessionId);

  if (!totalToPull) {
    return 0;
  }

  let offset = 0;
  let limit = calculatePageLimit();
  let currentBatchIndex = 0;
  let currentRows: [Record<string, any>?] = [];

  // pull changes a page at a time
  while (offset < totalToPull) {
    const startTime = Date.now();
    const records = await centralServer.pull(sessionId, limit, offset);
    const pullTime = Date.now() - startTime;
    const recordsToSave = records.map(r => ({
      ...r,
      // mark as never updated, so we don't push it back to the central server until the next update
      data: { ...r.data, updatedAtSyncTick: -1 },
      direction: SYNC_SESSION_DIRECTION.INCOMING,
    }));

    // This is an attempt to avoid storing all the pulled data
    // in the memory because we might run into memory issue when:
    // 1. During the first sync when there is a lot of data to load
    // 2. When a huge number of data is imported to sync and the facility syncs it down
    // So store the data in session_sync_records table instead and will persist it to
    //  the actual tables later

    currentRows.push(...recordsToSave);
    if (currentRows.length >= APPROX_PERSISTED_BATCH_SIZE) {
      await persistBatch(currentBatchIndex, currentRows);
      currentRows = [];
      currentBatchIndex++;
    }

    offset += recordsToSave.length;
    limit = calculatePageLimit(limit, pullTime);

    progressCallback(totalToPull, offset);
  }

  await persistBatch(currentBatchIndex, currentRows);

  return totalToPull;
};
