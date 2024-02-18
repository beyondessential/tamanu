import { makeDirectoryInDocuments, saveFileInDocuments } from '/helpers/file';
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

const WITH_ERROR = false;
const LIMIT = 15000;

async function getRecords(centralServer, sessionId, limit, fromId) {
  if (WITH_ERROR) return centralServer.pull(sessionId, limit, fromId);

  // Mock records
  const records = [];
  for (let i = 0; i < LIMIT; i++) {
    records.push({ recordType: 'test', data: { sumfield: String(i) } });
  }
  return records;
}

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

  if (WITH_ERROR) {
    await Promise.all(
      tableNames.map(t => makeDirectoryInDocuments(`syncSessions/${sessionId}/${t}`)),
    );
  } else {
    await Promise.all(
      ['test'].map(t => makeDirectoryInDocuments(`syncSessions/${sessionId}/${t}`)),
    );
  }

  let fromId;
  let limit = WITH_ERROR ? LIMIT : calculatePageLimit();
  let currentBatchIndex = 0;
  let totalPulled = 0;

  // pull changes a page at a time
  while (true) {
    const startTime = Date.now();
    const records = await getRecords(centralServer, sessionId, limit, fromId);
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

    if (WITH_ERROR === false) {
      await persistBatch(sessionId, currentBatchIndex, recordsToSave);
      currentBatchIndex++;
    }

    fromId = WITH_ERROR ? fromId : records[records.length - 1].id;
    totalPulled += recordsToSave.length;
    limit = WITH_ERROR ? LIMIT : calculatePageLimit(limit, pullTime);

    console.log('records saved', totalPulled);
    progressCallback(totalToPull, totalPulled);
  }

  return { totalPulled: 0, pullUntil: 0 };
};
