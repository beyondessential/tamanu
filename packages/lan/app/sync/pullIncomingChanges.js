import config from 'config';
import { chunk } from 'lodash';
import { log } from 'shared/services/logging';
import { SYNC_SESSION_DIRECTION } from 'shared/sync';

import { calculatePageLimit } from './calculatePageLimit';

const { persistedCacheBatchSize } = config.sync;

export const pullIncomingChanges = async (centralServer, models, sessionId, since) => {
  centralServer.setPullFilter(sessionId, since);
  const totalToPull = await centralServer.fetchPullCount(sessionId);

  let fromId;
  let limit = calculatePageLimit();
  let totalPulled = 0;
  log.debug(`pullIncomingChanges: syncing`, { sessionId, fromId });

  // pull changes a page at a time
  while (totalPulled < totalToPull) {
    log.debug(`pullIncomingChanges: pulling records`, {
      sessionId,
      fromId,
      limit,
    });
    const startTime = Date.now();
    const records = await centralServer.pull(sessionId, {
      fromId,
      limit,
    });
    fromId = records[records.length - 1]?.id;
    totalPulled += records.length;
    const pullTime = Date.now() - startTime;

    if (!records.length) {
      log.debug(`pullIncomingChanges: Pull returned no more changes, finishing`);
      break;
    }

    log.debug(`pullIncomingChanges: Pulled ${records.length} changes, saving to local cache`);

    const recordsToSave = records.map(r => ({
      ...r,
      data: { ...r.data, updatedAtSyncTick: -1 }, // mark as never updated, so we don't push it back to the central server until the next local update
      direction: SYNC_SESSION_DIRECTION.INCOMING,
    }));

    // This is an attempt to avoid storing all the pulled data
    // in the memory because we might run into memory issue when:
    // 1. During the first sync when there is a lot of data to load
    // 2. When a huge number of data is imported to sync and the facility syncs it down
    // So store the data in sync_session_records table instead and will persist it to the actual tables later
    for (const batchOfRows of chunk(recordsToSave, persistedCacheBatchSize)) {
      await models.SyncSessionRecord.bulkCreate(batchOfRows);
    }

    limit = calculatePageLimit(limit, pullTime);
  }

  return totalToPull;
};
