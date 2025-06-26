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
): Promise<{ totalBytes: number }> => {
  const rowsByRecordType = groupBy(rows, 'recordType');
  let totalBytes = 0;

  await Promise.all(
    Object.entries(rowsByRecordType).map(async ([recordType, rowsForRecordType]) => {
      const filePath = getFilePath(sessionId, recordType, batchIndex);
      const jsonString = JSON.stringify(rowsForRecordType);
      const buffer = Buffer.from(jsonString, 'utf-8');
      
      totalBytes += buffer.length;
      
      await saveFileInDocuments(
        buffer.toString('base64'),
        filePath,
      );
    }),
  );
  
  return { totalBytes };
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
  timing = null,
): Promise<{ totalPulled: number; pullUntil: number }> => {
  const { totalToPull, pullUntil } = await centralServer.initiatePull(
    sessionId,
    since,
    tableNames,
    tablesForFullResync,
    timing,
  );

  if (!totalToPull) {
    timing?.logAction('nothingToPull', { totalToPull: 0 });
    return { totalPulled: 0, pullUntil };
  }

  const directoryStartTime = Date.now();
  await Promise.all(
    tableNames.map(t => makeDirectoryInDocuments(`syncSessions/${sessionId}/${t}`)),
  );
  timing?.logAction('createDirectories', { 
    tableCount: tableNames.length,
    durationMs: Date.now() - directoryStartTime 
  });

  let fromId;
  let limit = calculatePageLimit();
  let currentBatchIndex = 0;
  let totalPulled = 0;
  let totalBytesProcessed = 0;

  // pull changes a page at a time
  while (totalPulled < totalToPull) {
    const batchStartTime = Date.now();
    
    const pullStartTime = Date.now();
    const records = await centralServer.pull(sessionId, limit, fromId);
    const pullTime = Date.now() - pullStartTime;
    
    // Calculate raw records byte size
    const rawRecordsBytes = Buffer.from(JSON.stringify(records), 'utf-8').length;
    
    const processStartTime = Date.now();
    const recordsToSave = records.map(r => ({
      ...r,
      // mark as never updated, so we don't push it back to the central server until the next update
      data: { ...r.data, updated_at_sync_tick: -1 },
      direction: SYNC_SESSION_DIRECTION.INCOMING,
    }));
    const processTime = Date.now() - processStartTime;
    
    // Calculate processed records byte size
    const processedRecordsBytes = Buffer.from(JSON.stringify(recordsToSave), 'utf-8').length;

    // This is an attempt to avoid storing all the pulled data
    // in the memory because we might run into memory issue when:
    // 1. During the first sync when there is a lot of data to load
    // 2. When a huge number of data is imported to sync and the facility syncs it down
    // So store the data in sync_session_records table instead and will persist it to
    //  the actual tables later

    const persistStartTime = Date.now();
    const { totalBytes: persistedBytes } = await persistBatch(sessionId, currentBatchIndex, recordsToSave);
    const persistTime = Date.now() - persistStartTime;
    
    const totalBatchTime = Date.now() - batchStartTime;
    
    timing?.logAction('pullBatch', {
      batchIndex: currentBatchIndex,
      batchSize: recordsToSave.length,
      fromId: fromId || 'start',
      limit,
      pullDurationMs: pullTime,
      processDurationMs: processTime,
      persistDurationMs: persistTime,
      totalBatchDurationMs: totalBatchTime,
      rawRecordsBytes,
      processedRecordsBytes,
      persistedBytes,
      bytesPerRecord: Math.round(rawRecordsBytes / recordsToSave.length),
      throughputBytesPerSecond: Math.round(rawRecordsBytes / (totalBatchTime / 1000)),
      progress: `${totalPulled + recordsToSave.length}/${totalToPull}`,
    });

    currentBatchIndex++;
    fromId = records[records.length - 1].id;
    totalPulled += recordsToSave.length;
    totalBytesProcessed += rawRecordsBytes;
    limit = calculatePageLimit(limit, pullTime);

    progressCallback(totalToPull, totalPulled);
  }
  
  timing?.logAction('pullIncomingChangesComplete', {
    totalBatches: currentBatchIndex,
    totalPulled,
    totalBytesProcessed,
    averageBytesPerRecord: Math.round(totalBytesProcessed / totalPulled),
    finalLimit: limit,
  });

  return { totalPulled: totalToPull, pullUntil };
};
