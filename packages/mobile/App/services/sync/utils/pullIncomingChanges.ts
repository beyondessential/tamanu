import { CentralServerConnection } from '../CentralServerConnection';
import { MODELS_MAP } from '~/models/modelsMap';
import { calculatePageLimit } from './calculatePageLimit';
import { chunkRows } from '~/infra/db/helpers';

/**
 * Pull incoming changes in batches and save them in session_sync_record table,
 * which will be used to persist to actual tables later
 * @param centralServer
 * @param models
 * @param currentSessionIndex
 * @param lastSessionIndex
 * @param progressCallback
 * @returns
 */
export const pullIncomingChanges = async (
  centralServer: CentralServerConnection,
  models: typeof MODELS_MAP,
  currentSessionIndex: number,
  lastSessionIndex: number,
  progressCallback: (total: number, progressCount: number) => void,
): Promise<number> => {
  const totalToPull = await centralServer.setPullFilter(currentSessionIndex, lastSessionIndex);

  let offset = 0;
  let limit = calculatePageLimit();

  // pull changes a page at a time
  while (offset < totalToPull) {
    const startTime = Date.now();
    const records = await centralServer.pull(currentSessionIndex, limit, offset);
    const pullTime = Date.now() - startTime;

    if (!records.length) {
      break;
    }

    const recordsToSave = records.map(r => ({
      ...r,
      data: JSON.stringify(r.data),
    }));

    // This is an attempt to avoid storing all the pulled data 
    // in the memory because we might run into memory issue when:
    // 1. During the first sync when there is a lot of data to load
    // 2. When a huge number of data is imported to sync and the facility syncs it down 
    // So store the data in session_sync_records table instead and will persist it to the actual tables later
    for (const batchOfRows of chunkRows(recordsToSave)) {
      await models.SessionSyncRecord.getRepository()
        .createQueryBuilder('session_sync_record')
        .insert()
        .into(models.SessionSyncRecord)
        .values(batchOfRows)
        .execute();
    }

    offset += recordsToSave.length;
    limit = calculatePageLimit(limit, pullTime);

    progressCallback(totalToPull, offset);
  }

  return totalToPull;
};
