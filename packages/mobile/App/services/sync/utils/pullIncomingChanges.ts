import { CentralServerConnection } from '../CentralServerConnection';
import { calculatePageLimit } from './calculatePageLimit';
import { SYNC_SESSION_DIRECTION } from '../constants';
import { saveFileInDocuments } from '/helpers/file';

const APPROX_PERSISTED_BATCH_SIZE = 20000;

/**
 * Pull incoming changes in batches and save them in sync_session_records table,
 * which will be used to persist to actual tables later
 * @param centralServer
 * @param models
 * @param sessionId
 * @param lastSuccessfulSyncTick
 * @param progressCallback
 * @returns
 */
export const pullIncomingChanges = async (
  centralServer: CentralServerConnection,
  sessionId: string,
  lastSuccessfulSyncTick: number,
  progressCallback: (total: number, progressCount: number) => void,
): Promise<number> => {
  const totalToPull = await centralServer.setPullFilter(sessionId, lastSuccessfulSyncTick);

  if (!totalToPull) {
    return 0;
  }

  let offset = 0;
  let limit = calculatePageLimit();
  let currentBatchIndex = 0;
  let currentRows = [];

  // pull changes a page at a time
  while (offset < totalToPull) {
    const startTime = Date.now();
    const records = await centralServer.pull(sessionId, limit, offset);
    const pullTime = Date.now() - startTime;
    const recordsToSave = records.map(r => ({
      ...r,
      direction: SYNC_SESSION_DIRECTION.INCOMING,
    }));

    // This is an attempt to avoid storing all the pulled data
    // in the memory because we might run into memory issue when:
    // 1. During the first sync when there is a lot of data to load
    // 2. When a huge number of data is imported to sync and the facility syncs it down
    // So store the data in sync_session_records table instead and will persist it to
    //  the actual tables later

    currentRows.push(...recordsToSave);
    if (currentRows.length >= APPROX_PERSISTED_BATCH_SIZE) {
      const fileName = `batch${currentBatchIndex}.json`;

      await saveFileInDocuments(
        Buffer.from(JSON.stringify(currentRows), 'utf-8').toString('base64'),
        fileName,
      );

      currentRows = [];
      currentBatchIndex++;
    }

    offset += recordsToSave.length;
    limit = calculatePageLimit(limit, pullTime);

    progressCallback(totalToPull, offset);
  }

  return totalToPull;
};
