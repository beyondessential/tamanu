import config from 'config';
import { chunk } from 'lodash';
import { log } from 'shared/services/logging';
import { calculatePageLimit } from './calculatePageLimit';

const { queryBatchSize } = config.sync;

export const pullIncomingChanges = async (centralServer, models, sessionIndex, lastSessionIndex) => {
  const totalToPull = await centralServer.setPullFilter(sessionIndex, lastSessionIndex);

  let offset = 0;
  let limit = calculatePageLimit();
  const incomingChanges = [];
  log.debug(`pullIncomingChanges: syncing`, { sessionIndex, offset });

  // pull changes a page at a time
  while (incomingChanges.length < totalToPull) {
    log.debug(`pullIncomingChanges: pulling records`, {
      sessionIndex,
      offset,
      limit,
    });
    const startTime = Date.now();
    const records = await centralServer.pull(sessionIndex, {
      offset,
      limit,
    });
    const pullTime = Date.now() - startTime;

    if (!records.length) {
      break;
    }
    
    // This is an attempt to avoid storing all the pulled data 
    // in the memory because we might run into memory issue when:
    // 1. During the first sync when there is a lot of data to load
    // 2. When a huge number of data is imported to sync and the facility syncs it down 
    // So store the data in session_sync_records table instead and will persist it to the actual tables later
    for (const batchOfRows of chunk(records, queryBatchSize)) {
      await models.SessionSyncRecord.bulkCreate(batchOfRows)
    }

    offset += records.length;

    limit = calculatePageLimit(limit, pullTime);
  }

  return totalToPull;
};
