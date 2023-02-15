import { saveFileInDocuments, makeDirectoryInDocuments } from '/helpers/file';
import { CentralServerConnection } from '../CentralServerConnection';
import { calculatePageLimit } from './calculatePageLimit';
import { SYNC_SESSION_DIRECTION } from '../constants';
import { groupBy } from 'lodash';
import { getFilePath } from './getFilePath';

const persistBatch = async (
  sessionId: string,
  batchIndex: number,
  rows: Record<string, any>[],
): Promise<void> => {
  const rowsByRecordType = groupBy(rows, 'recordType');

  await Promise.all(
    Object.entries(rowsByRecordType).map(async ([recordType, rowsForRecordType]) => {
      const filePath = getFilePath(sessionId, recordType, batchIndex);

      await saveFileInDocuments(
        Buffer.from(JSON.stringify(rowsForRecordType), 'utf-8').toString('base64'),
        filePath,
      );
    }),
  );
};

/**
 * Pull incoming changes in batches and save them in sync_session_records table,
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
  tableNames: string[],
  tablesForFullResync: string[],
  progressCallback: (total: number, progressCount: number) => void,
): Promise<{ totalPulled: number; pullUntil: number }> => {
  const { totalToPull, pullUntil } = await centralServer.initiatePull(
    sessionId,
    since,
    tableNames,
    tablesForFullResync,
  );

  if (!totalToPull) {
    return { totalPulled: 0, pullUntil };
  }

  await Promise.all(
    tableNames.map(t => makeDirectoryInDocuments(`syncSessions/${sessionId}/${t}`)),
  );

  let fromId;
  let limit = calculatePageLimit();
  let currentBatchIndex = 0;
  let totalPulled = 0;

  // pull changes a page at a time
  while (totalPulled < totalToPull) {
    const startTime = Date.now();
    const records = await centralServer.pull(sessionId, limit, fromId);
    const pullTime = Date.now() - startTime;
    const recordsToSave = records.map(r => ({
      ...r,
      // mark as never updated, so we don't push it back to the central server until the next update
      data: { ...r.data, updated_at_sync_tick: -1 },
      direction: SYNC_SESSION_DIRECTION.INCOMING,
    }));

    // This is an attempt to avoid storing all the pulled data
    // in the memory because we might run into memory issue when:
    // 1. During the first sync when there is a lot of data to load
    // 2. When a huge number of data is imported to sync and the facility syncs it down
    // So store the data in sync_session_records table instead and will persist it to
    //  the actual tables later

    await persistBatch(sessionId, currentBatchIndex, recordsToSave);
    currentBatchIndex++;

    fromId = records[records.length - 1].id;
    totalPulled += recordsToSave.length;
    limit = calculatePageLimit(limit, pullTime);

    progressCallback(totalToPull, totalPulled);
  }

  return { totalPulled: totalToPull, pullUntil };
};
