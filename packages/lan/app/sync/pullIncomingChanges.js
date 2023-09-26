import { chunk } from 'lodash';
import { log } from 'shared/services/logging';
import { insertSnapshotRecords, SYNC_SESSION_DIRECTION } from 'shared/sync';
import { sleepAsync } from '@tamanu/shared/utils/sleepAsync';

import { calculatePageLimit } from './calculatePageLimit';

export const pullIncomingChanges = async (centralServer, sequelize, sessionId, since) => {
  // initiating pull also returns the sync tick (or point on the sync timeline) that the
  // central server considers this session will be up to after pulling all changes
  log.info('FacilitySyncManager.pull.waitingForCentral');
  const { totalToPull, pullUntil } = await centralServer.initiatePull(sessionId, since);
  const {
    persistedCacheBatchSize,
    pauseBetweenCacheBatchInMilliseconds,
    dynamicLimiter,
  } = await centralServer.settings.get('sync');

  log.info('FacilitySyncManager.pulling', { since, totalToPull });
  let fromId;
  let limit = calculatePageLimit(dynamicLimiter);
  let totalPulled = 0;

  // pull changes a page at a time
  while (totalPulled < totalToPull) {
    log.debug('FacilitySyncManager.pull.pullingPage', {
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
      log.debug(`FacilitySyncManager.pull.noMoreChanges`);
      break;
    }

    log.info('FacilitySyncManager.savingChangesToSnapshot', { count: records.length });

    const recordsToSave = records.map(r => ({
      ...r,
      data: { ...r.data, updatedAtSyncTick: -1 }, // mark as never updated, so we don't push it back to the central server until the next local update
      direction: SYNC_SESSION_DIRECTION.INCOMING,
    }));

    // This is an attempt to avoid storing all the pulled data
    // in the memory because we might run into memory issue when:
    // 1. During the first sync when there is a lot of data to load
    // 2. When a huge number of data is imported to sync and the facility syncs it down
    // So store the data in a sync snapshot table instead and will persist it to the actual tables later
    for (const batchOfRows of chunk(recordsToSave, persistedCacheBatchSize)) {
      await insertSnapshotRecords(sequelize, sessionId, batchOfRows);

      await sleepAsync(pauseBetweenCacheBatchInMilliseconds);
    }

    limit = calculatePageLimit(dynamicLimiter, limit, pullTime);
  }

  return { totalPulled: totalToPull, pullUntil };
};
