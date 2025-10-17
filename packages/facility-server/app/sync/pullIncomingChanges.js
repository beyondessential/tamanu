import config from 'config';
import { chunk } from 'lodash';
import { log } from '@tamanu/shared/services/logging';
import { SYNC_STREAM_MESSAGE_KIND } from '@tamanu/constants';
import {
  insertSnapshotRecords,
  SYNC_SESSION_DIRECTION,
  SYNC_TICK_FLAGS,
} from '@tamanu/database/sync';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { calculatePageLimit } from './calculatePageLimit';

const { persistedCacheBatchSize, pauseBetweenCacheBatchInMilliseconds } = config.sync;

export const pullIncomingChanges = async (centralServer, sequelize, sessionId, since) => {
  const start = Date.now();

  // initiating pull also returns the sync tick (or point on the sync timeline) that the
  // central server considers this session will be up to after pulling all changes
  log.info('FacilitySyncManager.pull.waitingForCentral', { mode: 'polling' });
  const { totalToPull, pullUntil } = await centralServer.initiatePull(sessionId, since);

  log.info('FacilitySyncManager.pulling', { since, totalToPull });
  let fromId;
  let limit = calculatePageLimit();
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
    const { id, sortOrder } = records[records.length - 1];
    fromId = btoa(JSON.stringify({ sortOrder, id }));
    totalPulled += records.length;
    const pullTime = Date.now() - startTime;

    if (!records.length) {
      log.debug(`FacilitySyncManager.pull.noMoreChanges`);
      break;
    }

    log.info('FacilitySyncManager.savingChangesToSnapshot', { count: records.length });

    const recordsToSave = records.map(r => {
      delete r.sortOrder;
      return {
      ...r,
      data: { ...r.data, updatedAtSyncTick: SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER }, // mark as never updated, so we don't push it back to the central server until the next local update
      direction: SYNC_SESSION_DIRECTION.INCOMING,
    };
  });

    // This is an attempt to avoid storing all the pulled data
    // in the memory because we might run into memory issue when:
    // 1. During the first sync when there is a lot of data to load
    // 2. When a huge number of data is imported to sync and the facility syncs it down
    // So store the data in a sync snapshot table instead and will persist it to the actual tables later
    for (const batchOfRows of chunk(recordsToSave, persistedCacheBatchSize)) {
      await insertSnapshotRecords(sequelize, sessionId, batchOfRows);

      await sleepAsync(pauseBetweenCacheBatchInMilliseconds);
    }

    limit = calculatePageLimit(limit, pullTime);
  }

  log.info('FacilitySyncManager.pulled', { durationMs: Date.now() - start });
  return { totalPulled: totalToPull, pullUntil };
};

export const streamIncomingChanges = async (centralServer, sequelize, sessionId, since) => {
  const start = Date.now();

  // initiating pull also returns the sync tick (or point on the sync timeline) that the
  // central server considers this session will be up to after pulling all changes
  log.info('FacilitySyncManager.pull.waitingForCentral', { mode: 'streaming' });
  const { totalToPull, pullUntil } = await centralServer.initiatePull(sessionId, since);
  const WRITE_BATCH_SIZE = Math.min(persistedCacheBatchSize, totalToPull);

  const writeBatch = async records => {
    if (records.length === 0) return;
    await insertSnapshotRecords(
      sequelize,
      sessionId,
      records.map(r => ({
        ...r,
        // mark as never updated, so we don't push it back to the central server until the next local update
        data: { ...r.data, updatedAtSyncTick: SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER },
        direction: SYNC_SESSION_DIRECTION.INCOMING,
      })),
    );
  };

  log.info('FacilitySyncManager.pulling', { since, totalToPull });
  let totalPulled = 0; // statistics
  let records = []; // for batching writes
  let writes = []; // ongoing write promises

  // keep track of the ID we're on so we can resume the stream
  // on disconnect from where we left off rather than the start
  let fromId;
  const endpointFn = () => ({
    endpoint: `sync/${sessionId}/pull/stream`,
    query: { fromId },
  });

  stream: for await (const { kind, message } of centralServer.stream(endpointFn)) {
    if (records.length >= WRITE_BATCH_SIZE) {
      // do writes in the background while we're continuing to stream data
      writes.push(writeBatch(records));
      records = [];
    }

    handler: switch (kind) {
      case SYNC_STREAM_MESSAGE_KIND.PULL_CHANGE:
        records.push(message);
        totalPulled += 1;
        fromId = message.id;
        break handler;
      case SYNC_STREAM_MESSAGE_KIND.END:
        log.debug(`FacilitySyncManager.pull.noMoreChanges`);
        break stream;
      default:
        log.warn('FacilitySyncManager.pull.unknownMessageKind', { kind });
    }
  }

  if (records.length > 0) {
    writes.push(writeBatch(records));
  }

  await Promise.all(writes);

  log.info('FacilitySyncManager.pulled', { durationMs: Date.now() - start });
  return { totalPulled, totalToPull, pullUntil };
};
